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

export const updateITDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adCreated, o365LicenseAssigned, mfaEnabled, snipeItUserCreated } = req.body;

    const ticket = await prisma.onboardingTicket.findUnique({ where: { id: Number(id) } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Integrate with Mock APIs if requested to be true and wasn't before
    if (adCreated) await ActiveDirectoryService.createAccount({ firstName: ticket.firstName, lastName: ticket.lastName, department: ticket.department });
    if (o365LicenseAssigned && ticket.companyEmailId) await MicrosoftGraphService.assignLicense(ticket.companyEmailId);
    if (mfaEnabled && ticket.username) await ActiveDirectoryService.enableMFA(ticket.username);
    if (snipeItUserCreated && ticket.companyEmailId) await SnipeITService.createUser({ name: ticket.fullName, email: ticket.companyEmailId });

    const it = await prisma.iTDetails.update({
      where: { ticketId: Number(id) },
      data: { adCreated, o365LicenseAssigned, mfaEnabled, snipeItUserCreated, tempPassword: adCreated ? 'Welcome@123' : null }
    });

    await prisma.activityLog.create({
      data: { ticketId: Number(id), userId: req.user?.id, action: 'IT Details Updated', details: 'AD, O365, MFA, SnipeIT updated' }
    });

    res.status(200).json({ success: true, it });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAssetDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { assetTag, serialNumber, hostname, ram, storage, osVersion, antivirusStatus, assignedEngineer, deviceCondition } = req.body;
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
        deviceCondition
      }
    });

    if (assetTag) {
      await SnipeITService.assignAsset(999, assetTag); // Mock user ID 999
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

    res.status(200).json({ success: true, asset });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateDispatchDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const dispatch = await prisma.dispatchDetails.update({
      where: { ticketId: Number(id) },
      data
    });

    await prisma.activityLog.create({
      data: { ticketId: Number(id), userId: req.user?.id, action: 'Dispatch Details Updated', details: `Tracking: ${data.trackingId || 'N/A'}` }
    });

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

    // Audit: Employee ID set
    await prisma.activityLog.create({
      data: {
        ticketId,
        userId: req.user?.id,
        action: 'Keka Employee ID Updated',
        details: `Employee ID set to "${kekaEmployeeId}" by HR. Profile URL: ${kekaProfileUrl || 'N/A'}.`
      }
    });

    // Audit: Inventory sync (when asset assigned)
    if (ticket.assetDetails?.assetTag) {
      await prisma.activityLog.create({
        data: {
          ticketId,
          userId: req.user?.id,
          action: 'Employee ID Synced to Asset Record',
          details: `Keka Employee ID "${kekaEmployeeId}" synced to asset tag "${ticket.assetDetails.assetTag}" for inventory module alignment.`
        }
      });
    }

    res.status(200).json({ success: true, ticket: updatedTicket });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
