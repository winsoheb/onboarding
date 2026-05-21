import { Request, Response } from 'express';
import prisma from '../utils/prismaClient';
import { ActiveDirectoryService, MicrosoftGraphService, SnipeITService } from '../services/mockApis';
import { FileStorageService } from '../services/FileStorageService';

export const updateHRDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      bgvStatus, approvalType, hrRemarks, documentsUploaded, inductionSchedule,
      meetingLink, hrCoordinator, inductionNotes,
      approved, bgvProof, bgvProofName, bgvProofType, bgvExceptionReason
    } = req.body;
    const ticketId = Number(id);

    const existingHR = await prisma.hRDetails.findUnique({ where: { ticketId } });
    if (!existingHR) return res.status(404).json({ error: 'HR details not found' });

    // Validate induction schedule lock before DOJ
    const isInductionUpdate = inductionSchedule !== undefined || meetingLink !== undefined || hrCoordinator !== undefined || inductionNotes !== undefined;
    if (isInductionUpdate) {
      const ticket = await prisma.onboardingTicket.findUnique({
        where: { id: ticketId }
      });
      if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const doj = new Date(ticket.doj);
      doj.setHours(0, 0, 0, 0);
      if (doj > today) {
        return res.status(400).json({ error: 'Induction Schedule task is locked until DOJ. You can only update it on or after the joining day.' });
      }
    }

    // Validate exception approval requirements
    if (approvalType === 'EXCEPTION_APPROVAL' && approved) {
      if (!bgvExceptionReason && !existingHR.bgvExceptionReason) {
        return res.status(400).json({ error: 'Exception Reason is mandatory for Exception Approval.' });
      }
      const finalProofCheck = bgvProof || existingHR.bgvProof;
      if (!finalProofCheck) {
        return res.status(400).json({ error: 'Proof document upload is mandatory for Exception Approval.' });
      }
    }

    let bgvApprovedAt = existingHR.bgvApprovedAt;
    let bgvUploadedAt = existingHR.bgvUploadedAt;
    let bgvUploadedBy = existingHR.bgvUploadedBy;
    let finalApproved = approved !== undefined ? approved : existingHR.approved;
    let finalProof = existingHR.bgvProof;
    let finalProofName = existingHR.bgvProofName;
    let finalProofType = existingHR.bgvProofType;

    const isReplacingProof = bgvProof && bgvProof !== existingHR.bgvProof;

    if (isReplacingProof) {
      // Audit log previous proof metadata
      await prisma.activityLog.create({
        data: {
          ticketId,
          userId: req.user?.id,
          action: 'BGV Exception Proof Replaced',
          details: `Previous proof: "${existingHR.bgvProofName || 'N/A'}" by "${existingHR.bgvUploadedBy || 'N/A'}" at ${existingHR.bgvUploadedAt ? new Date(existingHR.bgvUploadedAt).toLocaleString() : 'N/A'}. Reason was: "${existingHR.bgvExceptionReason || 'N/A'}". Re-approval required.`
        }
      });
      const uploadResult = await FileStorageService.uploadFile(bgvProof, bgvProofName || 'proof.png', bgvProofType || 'image/png');
      finalProof = uploadResult.fileUrl;
      finalProofName = bgvProofName;
      finalProofType = bgvProofType;
      bgvUploadedAt = new Date();
      bgvUploadedBy = req.user?.email || 'HR';
      bgvApprovedAt = null;
      finalApproved = false;
    } else if (bgvProof === null && existingHR.bgvProof !== null) {
      if (existingHR.bgvApprovedAt) {
        return res.status(400).json({ error: 'Security: Cannot delete approved BGV exception proof. Start a re-approval workflow.' });
      }
      finalProof = null; finalProofName = null; finalProofType = null;
      bgvUploadedAt = null; bgvUploadedBy = null; bgvApprovedAt = null;
      finalApproved = false;
    }

    // Set approval timestamp on first approval
    if (finalApproved && !existingHR.approved) {
      bgvApprovedAt = new Date();
      if (!bgvUploadedAt && bgvProof) {
        const uploadResult = await FileStorageService.uploadFile(bgvProof, bgvProofName || 'proof.png', bgvProofType || 'image/png');
        finalProof = uploadResult.fileUrl;
        finalProofName = bgvProofName;
        finalProofType = bgvProofType;
        bgvUploadedAt = new Date();
        bgvUploadedBy = req.user?.email || 'HR';
      }
    }

    const hr = await prisma.hRDetails.update({
      where: { ticketId },
      data: {
        bgvStatus,
        approvalType,
        hrRemarks,
        documentsUploaded,
        inductionSchedule: inductionSchedule ? new Date(inductionSchedule) : existingHR.inductionSchedule,
        meetingLink: meetingLink !== undefined ? meetingLink : existingHR.meetingLink,
        hrCoordinator: hrCoordinator !== undefined ? hrCoordinator : existingHR.hrCoordinator,
        inductionNotes: inductionNotes !== undefined ? inductionNotes : existingHR.inductionNotes,
        approved: finalApproved,
        bgvProof: finalProof,
        bgvProofName: finalProofName,
        bgvProofType: finalProofType,
        bgvExceptionReason: bgvExceptionReason !== undefined ? bgvExceptionReason : existingHR.bgvExceptionReason,
        bgvUploadedAt,
        bgvUploadedBy,
        bgvApprovedAt
      }
    });

    // Build audit log for meaningful changes
    const changes: string[] = [];
    if (bgvStatus && bgvStatus !== existingHR.bgvStatus) changes.push(`BGV Status: "${existingHR.bgvStatus}" → "${bgvStatus}"`);
    if (approvalType && approvalType !== existingHR.approvalType) changes.push(`Approval Type: "${existingHR.approvalType || 'None'}" → "${approvalType}"`);
    if (finalApproved !== existingHR.approved) changes.push(`Approved: ${existingHR.approved} → ${finalApproved}`);
    if (isReplacingProof) changes.push(`New exception proof uploaded: "${bgvProofName}"`);
    if (hrRemarks && hrRemarks !== existingHR.hrRemarks) changes.push('HR Remarks updated');
    if (inductionSchedule && inductionSchedule !== existingHR.inductionSchedule?.toISOString()) changes.push(`Induction scheduled: ${new Date(inductionSchedule).toLocaleString()}`);
    if (meetingLink && meetingLink !== existingHR.meetingLink) changes.push('Meeting link updated');

    if (changes.length > 0) {
      await prisma.activityLog.create({
        data: {
          ticketId,
          userId: req.user?.id,
          action: 'HR Details Updated',
          details: changes.join('; ')
        }
      });
    }

    res.status(200).json({ success: true, hr });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const LICENSE_MAP: Record<string, number> = {
  'SBQ-Basic': 37,
  'SBQ-Standard': 88,
  'EE-Standard': 55,
  'EE-Basic': 56
};

export const getAvailableLicenses = async (req: Request, res: Response) => {
  try {
    const licenseTypes = ['EE-Basic', 'EE-Standard', 'SBQ-Basic', 'SBQ-Standard'];
    const counts: Record<string, number> = {};

    for (const type of licenseTypes) {
      const licenseId = LICENSE_MAP[type];
      const snipeSeats = await SnipeITService.getLicenseSeats(licenseId);
      if (snipeSeats !== -1) {
        counts[type] = snipeSeats;
      } else {
        // Fallback to local DB Available count
        const dbCount = await prisma.licenseInventory.count({
          where: { licenseType: type, status: 'Available' }
        });
        counts[type] = dbCount;
      }
    }

    const licenses = await prisma.licenseInventory.findMany({
      where: { status: 'Available' },
      select: {
        id: true,
        licenseKey: true,
        licenseType: true,
        snipeItLicenseId: true
      }
    });

    res.status(200).json({ success: true, licenses, counts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateITDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adCreated, mfaEnabled, vpnCreated, pitCreated, assignedO365LicenseType, snipeItUserCreated } = req.body;
    const ticketId = Number(id);

    const ticket = await prisma.onboardingTicket.findUnique({ 
      where: { id: ticketId },
      include: { itDetails: true }
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const currentIT = ticket.itDetails;
    if (!currentIT) return res.status(404).json({ error: 'IT details not found' });

    let finalAssignedLicense = currentIT.assignedO365License;
    let finalO365LicenseAssigned = currentIT.o365LicenseAssigned;
    const auditLogs: string[] = [];

    // 1. License Allocation / Re-allocation
    let currentLicenseType: string | null = null;
    if (currentIT.assignedO365License) {
      const parts = currentIT.assignedO365License.split('-');
      if (parts.length >= 2) {
        currentLicenseType = `${parts[0]}-${parts[1]}`;
      }
    }

    if (assignedO365LicenseType && assignedO365LicenseType !== currentLicenseType) {
      // Validate Snipe-IT / inventory availability first
      const mappedLicenseId = LICENSE_MAP[assignedO365LicenseType];
      if (mappedLicenseId === undefined) {
        return res.status(400).json({ error: `Invalid license type: ${assignedO365LicenseType}` });
      }

      const snipeSeats = await SnipeITService.getLicenseSeats(mappedLicenseId);
      let isAvailable = false;
      if (snipeSeats !== -1) {
        isAvailable = snipeSeats > 0;
      } else {
        const dbCount = await prisma.licenseInventory.count({
          where: { licenseType: assignedO365LicenseType, status: 'Available' }
        });
        isAvailable = dbCount > 0;
      }

      if (!isAvailable) {
        return res.status(400).json({ error: `Insufficient inventory: No seats available for type ${assignedO365LicenseType} in Snipe-IT/Inventory.` });
      }

      // Release current license
      if (currentIT.assignedO365License) {
        const oldLicense = await prisma.licenseInventory.findUnique({
          where: { licenseKey: currentIT.assignedO365License }
        });
        if (oldLicense) {
          await prisma.licenseInventory.update({
            where: { id: oldLicense.id },
            data: { status: 'Available', assignedToEmail: null, assignedToTicket: null }
          });
          await prisma.licenseHistory.create({
            data: {
              licenseId: oldLicense.id,
              action: 'Released',
              assignedToEmail: ticket.companyEmailId || ticket.personalEmail,
              details: `Released due to license type change to ${assignedO365LicenseType}`
            }
          });
          auditLogs.push(`Released previous license ${oldLicense.licenseKey}`);
        }
      }

      // Find next available license in database
      const nextLicense = await prisma.licenseInventory.findFirst({
        where: { licenseType: assignedO365LicenseType, status: 'Available' },
        orderBy: { licenseKey: 'asc' }
      });

      if (!nextLicense) {
        return res.status(400).json({ error: `No available license keys for type ${assignedO365LicenseType} in database inventory` });
      }

      // Assign the new license
      await prisma.licenseInventory.update({
        where: { id: nextLicense.id },
        data: { 
          status: 'Assigned', 
          assignedToEmail: ticket.companyEmailId || ticket.personalEmail,
          assignedToTicket: ticket.ticketNumber
        }
      });

      await prisma.licenseHistory.create({
        data: {
          licenseId: nextLicense.id,
          action: 'Assigned',
          assignedToEmail: ticket.companyEmailId || ticket.personalEmail,
          details: `Assigned to employee ${ticket.fullName} via onboarding ticket ${ticket.ticketNumber}`
        }
      });

      // Integrate with Mock APIs for Graph API
      await MicrosoftGraphService.assignLicense(
        ticket.companyEmailId || ticket.personalEmail,
        assignedO365LicenseType
      );

      finalAssignedLicense = nextLicense.licenseKey;
      finalO365LicenseAssigned = true;
      auditLogs.push(`O365 license assigned: allocated ${nextLicense.licenseKey} (Snipe-IT License ID: ${nextLicense.snipeItLicenseId})`);
      auditLogs.push(`Inventory updated: ${nextLicense.licenseKey} status set to Assigned`);
    } else if (assignedO365LicenseType === null || assignedO365LicenseType === '') {
      if (currentIT.assignedO365License) {
        const oldLicense = await prisma.licenseInventory.findUnique({
          where: { licenseKey: currentIT.assignedO365License }
        });
        if (oldLicense) {
          await prisma.licenseInventory.update({
            where: { id: oldLicense.id },
            data: { status: 'Available', assignedToEmail: null, assignedToTicket: null }
          });
          await prisma.licenseHistory.create({
            data: {
              licenseId: oldLicense.id,
              action: 'Released',
              assignedToEmail: ticket.companyEmailId || ticket.personalEmail,
              details: 'Cleared license allocation from ticket'
            }
          });
          auditLogs.push(`Released license ${oldLicense.licenseKey}`);
          auditLogs.push(`Inventory updated: ${oldLicense.licenseKey} status set to Available`);
        }
        finalAssignedLicense = null;
        finalO365LicenseAssigned = false;
      }
    }

    // 2. Perform Mock API calls for checkboxes changing to true
    if (adCreated && !currentIT.adCreated) {
      await ActiveDirectoryService.createAccount({ firstName: ticket.firstName, lastName: ticket.lastName, department: ticket.department });
      auditLogs.push('AD account created');
    }
    if (mfaEnabled && !currentIT.mfaEnabled) {
      await ActiveDirectoryService.enableMFA(ticket.username || `${ticket.firstName.toLowerCase()}.${ticket.lastName.toLowerCase()}`);
      auditLogs.push('MFA enabled');
    }
    if (vpnCreated && !currentIT.vpnCreated) {
      auditLogs.push('VPN account created');
    }
    if (pitCreated && !currentIT.pitCreated) {
      auditLogs.push('PIT account created');
    }
    if (snipeItUserCreated && !currentIT.snipeItUserCreated && ticket.companyEmailId) {
      await SnipeITService.createUser({ name: ticket.fullName, email: ticket.companyEmailId });
      auditLogs.push('Snipe-IT user created');
    }

    // 3. Update database
    const it = await prisma.iTDetails.update({
      where: { ticketId },
      data: {
        adCreated: adCreated !== undefined ? adCreated : currentIT.adCreated,
        o365LicenseAssigned: finalO365LicenseAssigned,
        mfaEnabled: mfaEnabled !== undefined ? mfaEnabled : currentIT.mfaEnabled,
        vpnCreated: vpnCreated !== undefined ? vpnCreated : currentIT.vpnCreated,
        pitCreated: pitCreated !== undefined ? pitCreated : currentIT.pitCreated,
        assignedO365License: finalAssignedLicense,
        snipeItUserCreated: snipeItUserCreated !== undefined ? snipeItUserCreated : currentIT.snipeItUserCreated,
        tempPassword: adCreated ? 'Welcome@123' : currentIT.tempPassword
      }
    });

    // 4. Create ActivityLog entry
    if (auditLogs.length > 0) {
      await prisma.activityLog.create({
        data: {
          ticketId,
          userId: req.user?.id,
          action: 'IT Details Updated',
          details: auditLogs.join(', ')
        }
      });
    }

    // 5. Trigger checkReadyForDispatch
    await checkReadyForDispatch(ticketId, req.user?.id);

    res.status(200).json({ success: true, it });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const validateAsset = async (req: Request, res: Response) => {
  try {
    const { search, searchType } = req.query as { search: string; searchType: 'serial' | 'asset_tag' };

    if (!search || !searchType) {
      return res.status(400).json({ error: 'search and searchType (serial | asset_tag) are required.' });
    }

    if (!['serial', 'asset_tag'].includes(searchType)) {
      return res.status(400).json({ error: 'searchType must be "serial" or "asset_tag".' });
    }

    const result = await SnipeITService.checkAssetDeployable(search.trim(), searchType);

    if (!result.deployable) {
      return res.status(422).json({
        deployable: false,
        statusName: result.statusName,
        statusId: result.statusId,
        assetId: result.assetId,
        error: result.error || `Selected asset is not deployable. Current status: "${result.statusName}". Only assets with status "Deployable" (ID=4) can be assigned.`
      });
    }

    return res.status(200).json({
      deployable: true,
      assetId: result.assetId,
      statusId: result.statusId,
      statusName: result.statusName,
      assetName: result.assetName,
      message: `Asset verified as Deployable.`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAssetDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { assetTag, serialNumber, hostname, ram, storage, osVersion, antivirusStatus, assignedEngineer, deviceCondition, handoverType, assetValidated, assetSnipeId, assetStatusName } = req.body;
    const ticketId = Number(id);

    // Uniqueness validation for active onboarding tickets
    if (assetTag || serialNumber) {
      const clauses: any[] = [];
      if (assetTag) clauses.push({ assetTag });
      if (serialNumber) clauses.push({ serialNumber });

      const duplicate = await prisma.assetDetails.findFirst({
        where: {
          OR: clauses,
          NOT: { ticketId }
        },
        include: {
          ticket: true
        }
      });

      if (duplicate) {
        const dupField = duplicate.assetTag === assetTag ? 'Asset Tag' : 'Serial Number';
        const dupVal = duplicate.assetTag === assetTag ? assetTag : serialNumber;
        return res.status(400).json({
          error: `Uniqueness Validation Failed: ${dupField} "${dupVal}" is already allocated to candidate ${duplicate.ticket.firstName} ${duplicate.ticket.lastName} (Ticket: ${duplicate.ticket.id}).`
        });
      }
    }

    const existingAsset = await prisma.assetDetails.findUnique({
      where: { ticketId }
    });
    if (!existingAsset) return res.status(404).json({ error: 'Asset details not found' });

    // Track changes for audit logs
    const changes: string[] = [];
    if (assetTag !== undefined && assetTag !== existingAsset.assetTag) changes.push(`Asset Tag: "${existingAsset.assetTag || 'None'}" -> "${assetTag}"`);
    if (serialNumber !== undefined && serialNumber !== existingAsset.serialNumber) changes.push(`Serial Number: "${existingAsset.serialNumber || 'None'}" -> "${serialNumber}"`);
    if (hostname !== undefined && hostname !== existingAsset.hostname) changes.push(`Hostname: "${existingAsset.hostname || 'None'}" -> "${hostname}"`);
    if (assignedEngineer !== undefined && assignedEngineer !== existingAsset.assignedEngineer) changes.push(`Engineer: "${existingAsset.assignedEngineer || 'None'}" -> "${assignedEngineer}"`);

    const asset = await prisma.assetDetails.update({
      where: { ticketId },
      data: {
        assetTag,
        serialNumber,
        hostname,
        ram,
        storage,
        osVersion,
        antivirusStatus,
        assignedEngineer,
        deviceCondition,
        ...(handoverType !== undefined ? { handoverType } : {}),
        ...(assetValidated !== undefined ? { assetValidated } : {}),
        ...(assetSnipeId !== undefined ? { assetSnipeId } : {}),
        ...(assetStatusName !== undefined ? { assetStatusName } : {})
      }
    });

    if (assetTag) {
      await SnipeITService.assignAsset(999, assetTag); // Mock user ID 999
    }

    const isCompletedNow = !!(asset.assetTag && asset.serialNumber && asset.hostname && asset.assignedEngineer);
    const wasCompletedBefore = !!(existingAsset.assetTag && existingAsset.serialNumber && existingAsset.hostname && existingAsset.assignedEngineer);

    if (isCompletedNow && !wasCompletedBefore) {
      await prisma.activityLog.create({
        data: {
          ticketId,
          userId: req.user?.id,
          action: 'Asset preparation completed',
          details: `All hardware configuration settings completed. Engineer assigned: ${assignedEngineer || 'N/A'}.`
        }
      });
    }

    if (changes.length > 0) {
      await prisma.activityLog.create({
        data: {
          ticketId,
          userId: req.user?.id,
          action: 'Asset Details Updated',
          details: changes.join(', ')
        }
      });
    }

    // Trigger checkReadyForDispatch
    await checkReadyForDispatch(ticketId, req.user?.id);

    res.status(200).json({ success: true, asset });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const checkReadyForDispatch = async (ticketId: number, userId?: number) => {
  try {
    const ticket = await prisma.onboardingTicket.findUnique({
      where: { id: ticketId },
      include: {
        itDetails: true,
        assetDetails: true,
        credentialSheet: true,
        activityLogs: {
          where: { action: 'Ready for dispatch' }
        }
      }
    });

    if (!ticket) return;

    const isItComplete = ticket.itDetails?.adCreated && ticket.itDetails?.o365LicenseAssigned && ticket.itDetails?.mfaEnabled;
    const isAssetComplete = ticket.assetDetails?.hostname && ticket.assetDetails?.serialNumber && ticket.assetDetails?.assetTag && ticket.assetDetails?.assignedEngineer;
    const isCredUploaded = !!ticket.credentialSheet;
    const isGetpassUploaded = !!ticket.assetDetails?.getpassUploaded;
    const isHandoverSelected = !!ticket.assetDetails?.handoverType;

    if (isItComplete && isAssetComplete && isCredUploaded && isGetpassUploaded && isHandoverSelected) {
      if (ticket.activityLogs.length === 0) {
        await prisma.activityLog.create({
          data: {
            ticketId,
            userId,
            action: 'Ready for dispatch',
            details: `IT accounts created, credentials sheet uploaded, GetPass package uploaded, handover type: ${ticket.assetDetails?.handoverType}. Asset preparation complete. Ticket is ready for handover/dispatch.`
          }
        });
      }
    }
  } catch (err: any) {
    console.error(`[checkReadyForDispatch] Failed: ${err.message}`);
  }
};

export const uploadGetPass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fileName, fileContent, fileType, passwordHint, handoverType } = req.body;
    const ticketId = Number(id);

    if (!fileName || !fileContent || !fileType) {
      return res.status(400).json({ error: 'fileName, fileContent, and fileType are required.' });
    }

    // Only accept PDF
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && fileType !== 'application/pdf') {
      return res.status(400).json({ error: 'Invalid file format. Only password-protected PDF is accepted for GetPass package.' });
    }

    const existingAsset = await prisma.assetDetails.findUnique({ where: { ticketId } });
    if (!existingAsset) return res.status(404).json({ error: 'Asset details not found for this ticket.' });

    const updatedAsset = await prisma.assetDetails.update({
      where: { ticketId },
      data: {
        getpassUploaded: true,
        getpassFileName: fileName,
        getpassFileContent: fileContent,
        getpassFileType: fileType,
        getpassUploadedBy: req.user?.email || 'System',
        getpassUploadedAt: new Date(),
        getpassPasswordHint: passwordHint || null,
        ...(handoverType ? { handoverType } : {})
      }
    });

    await prisma.activityLog.create({
      data: {
        ticketId,
        userId: req.user?.id,
        action: 'GetPass package uploaded',
        details: `GetPass credential package "${fileName}" uploaded. Handover type: ${handoverType || existingAsset.handoverType || 'Not set'}.`
      }
    });

    await checkReadyForDispatch(ticketId, req.user?.id);

    res.status(200).json({ success: true, asset: updatedAsset });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadCredentialSheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fileName, fileContent, fileType, passwordHint } = req.body;
    const ticketId = Number(id);

    if (!fileName || !fileContent || !fileType) {
      return res.status(400).json({ error: 'fileName, fileContent, and fileType are required' });
    }

    // Format validation: must be XLSX, PDF or ZIP
    const ext = fileName.split('.').pop()?.toLowerCase();
    const allowedExts = ['xlsx', 'pdf', 'zip'];
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed'
    ];

    if (!allowedExts.includes(ext || '') || !allowedMimeTypes.includes(fileType)) {
      return res.status(400).json({ error: 'Invalid file format. Accepted formats: XLSX, PDF, password protected ZIP' });
    }

    const existingSheet = await prisma.credentialSheet.findUnique({
      where: { ticketId }
    });

    let credentialSheet;
    let logAction = 'Credential sheet uploaded';
    let logDetails = `File "${fileName}" uploaded successfully.`;

    if (existingSheet) {
      credentialSheet = await prisma.credentialSheet.update({
        where: { ticketId },
        data: {
          fileName,
          fileContent,
          fileType,
          uploadedBy: req.user?.email || 'System',
          uploadedAt: new Date(),
          passwordHint
        }
      });
      logAction = 'Credential sheet replaced';
      logDetails = `File "${existingSheet.fileName}" replaced with "${fileName}".`;
    } else {
      credentialSheet = await prisma.credentialSheet.create({
        data: {
          ticketId,
          fileName,
          fileContent,
          fileType,
          uploadedBy: req.user?.email || 'System',
          passwordHint
        }
      });
    }

    // Log the upload/replace action
    await prisma.activityLog.create({
      data: {
        ticketId,
        userId: req.user?.id,
        action: logAction,
        details: logDetails
      }
    });

    // Check if the ticket is now ready for dispatch
    await checkReadyForDispatch(ticketId, req.user?.id);

    res.status(200).json({ success: true, credentialSheet });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateDispatchDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { courierScheduled, courierVendor, trackingId, deliveryStatus, dispatchDate, deliveryNote } = req.body;
    const ticketId = Number(id);

    const existing = await prisma.dispatchDetails.findUnique({ where: { ticketId } });
    if (!existing) return res.status(404).json({ error: 'Dispatch details not found.' });

    const updateData: any = {};
    if (courierScheduled !== undefined) updateData.courierScheduled = courierScheduled;
    if (courierVendor !== undefined) updateData.courierVendor = courierVendor;
    if (trackingId !== undefined) updateData.trackingId = trackingId;
    if (dispatchDate !== undefined) updateData.dispatchDate = dispatchDate ? new Date(dispatchDate) : null;
    if (deliveryNote !== undefined) updateData.deliveryNote = deliveryNote;

    let logAction = 'Dispatch Details Updated';
    let logDetailsParts: string[] = [];

    if (courierVendor && existing.courierVendor !== courierVendor) logDetailsParts.push(`Courier Vendor: ${courierVendor}`);
    if (trackingId && existing.trackingId !== trackingId) logDetailsParts.push(`Tracking ID: ${trackingId}`);
    if (dispatchDate && existing.dispatchDate?.toISOString() !== new Date(dispatchDate).toISOString()) {
      logDetailsParts.push(`Dispatch Date: ${new Date(dispatchDate).toLocaleDateString()}`);
    }

    if (deliveryStatus !== undefined && existing.deliveryStatus !== deliveryStatus) {
      updateData.deliveryStatus = deliveryStatus;
      logDetailsParts.push(`Status changed to ${deliveryStatus || 'Pending'}`);

      // Handle specific delivery confirmation
      if (deliveryStatus === 'Delivered') {
        updateData.deliveredAt = new Date();
        updateData.deliveredBy = req.user?.email || 'System';

        // Log visible to TA and HR: laptop delivered notification
        await prisma.activityLog.create({
          data: {
            ticketId,
            userId: req.user?.id,
            action: 'Laptop Delivered ✅',
            details: `Laptop successfully delivered to the employee. Courier: ${updateData.courierVendor || existing.courierVendor || 'N/A'}. Tracking: ${updateData.trackingId || existing.trackingId || 'N/A'}. Note: ${deliveryNote || existing.deliveryNote || 'None'}. Marked by: ${req.user?.email || 'System'}.`
          }
        });
      } else {
        // If moved backwards from Delivered, clear the deliveredAt
        if (existing.deliveryStatus === 'Delivered') {
          updateData.deliveredAt = null;
          updateData.deliveredBy = null;
        }
      }
    }

    const dispatch = await prisma.dispatchDetails.update({
      where: { ticketId },
      data: updateData
    });

    if (logDetailsParts.length > 0) {
      await prisma.activityLog.create({
        data: { ticketId, userId: req.user?.id, action: logAction, details: logDetailsParts.join(', ') }
      });
    } else if (courierScheduled !== undefined && existing.courierScheduled !== courierScheduled) {
      await prisma.activityLog.create({
        data: { ticketId, userId: req.user?.id, action: 'Courier Schedule Updated', details: `Courier Scheduled: ${courierScheduled}` }
      });
    }

    res.status(200).json({ success: true, dispatch });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateQADetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const qa = await prisma.qADetails.update({
      where: { ticketId: Number(id) },
      data
    });

    await prisma.activityLog.create({
      data: { ticketId: Number(id), userId: req.user?.id, action: 'QA Checklist Updated', details: 'Checked items updated' }
    });

    res.status(200).json({ success: true, qa });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateKekaDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { kekaEmployeeId, kekaProfileUrl, kekaHrNotes } = req.body;
    const ticketId = Number(id);

    if (!kekaEmployeeId || !kekaEmployeeId.trim()) {
      return res.status(400).json({ error: 'Employee ID is mandatory.' });
    }

    const ticket = await prisma.onboardingTicket.findUnique({
      where: { id: ticketId },
      include: { assetDetails: true }
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // DOJ-lock: only allow on or after DOJ
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const doj = new Date(ticket.doj);
    doj.setHours(0, 0, 0, 0);
    if (doj > today) {
      return res.status(400).json({ error: `Employee ID (Keka) task is locked until DOJ: ${doj.toLocaleDateString()}. This field unlocks on joining day.` });
    }

    // Validation: Sync only after asset assigned
    if (!ticket.assetDetails || !ticket.assetDetails.assetTag) {
      return res.status(400).json({ error: 'Validation Error: Employee ID sync requires an assigned asset. Please assign an Asset Tag in the Asset Preparation module before updating Employee ID.' });
    }

    // Uniqueness check across all tickets
    const duplicate = await prisma.onboardingTicket.findFirst({
      where: { kekaEmployeeId, NOT: { id: ticketId } }
    });
    if (duplicate) {
      return res.status(400).json({ error: `Employee ID "${kekaEmployeeId}" is already assigned to ticket #${duplicate.id} (${duplicate.fullName}).` });
    }

    // Also check legacy employeeId field
    const dupLegacy = await prisma.onboardingTicket.findFirst({
      where: { employeeId: kekaEmployeeId, NOT: { id: ticketId } }
    });
    if (dupLegacy) {
      return res.status(400).json({ error: `Employee ID "${kekaEmployeeId}" conflicts with an existing employee record.` });
    }

    // Save to ticket — sync kekaEmployeeId back to employeeId as well
    const updatedTicket = await prisma.onboardingTicket.update({
      where: { id: ticketId },
      data: {
        kekaEmployeeId: kekaEmployeeId.trim(),
        kekaProfileUrl,
        kekaHrNotes,
        employeeId: kekaEmployeeId.trim() // Sync to main employeeId field
      }
    });

    // Trigger automated Snipe-IT & Inventory Sync
    const syncResult = await SnipeITService.syncEmployeeId(
      ticket.companyEmailId || '',
      kekaEmployeeId.trim(),
      ticket.assetDetails.assetTag
    );

    // Audit Log: Employee ID updated by HR
    await prisma.activityLog.create({
      data: {
        ticketId,
        userId: req.user?.id,
        action: 'Employee ID updated by HR',
        details: `Employee ID updated by HR to "${kekaEmployeeId.trim()}". Profile URL: ${kekaProfileUrl || 'N/A'}. HR Notes: ${kekaHrNotes || 'N/A'}`
      }
    });

    // Audit Log: Inventory employee number synced
    await prisma.activityLog.create({
      data: {
        ticketId,
        userId: req.user?.id,
        action: 'Inventory employee number synced',
        details: `Employee ID "${kekaEmployeeId.trim()}" successfully mapped and synced to Snipe-IT user, Inventory module, Asset records, and device details associated with ${ticket.companyEmailId}. Result: ${syncResult.message}`
      }
    });

    res.status(200).json({ success: true, ticket: updatedTicket });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
