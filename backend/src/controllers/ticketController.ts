import { Request, Response } from 'express';
import prisma from '../utils/prismaClient';
import { ITInventoryService, SnipeITService } from '../services/mockApis';

const getDomainForCompany = (company: string): string => {
  if (company && (company.toLowerCase().includes('smartbooqing') || company.toLowerCase().includes('smartbooqng'))) {
    return 'smartbooqing.nl';
  }
  return 'easternenterprise.com';
};

export const helperGenerateEmail = async (firstName: string, lastName: string, company: string): Promise<string> => {
  const fn = firstName.toLowerCase().replace(/\s+/g, '');
  const ln = lastName.toLowerCase().replace(/\s+/g, '');
  const domain = getDomainForCompany(company);

  let companyEmailId = '';
  let isUnique = false;

  // 1. Try first name prefixes (s.shaikh, so.shaikh, soh.shaikh...)
  for (let i = 1; i <= fn.length; i++) {
    const prefix = fn.substring(0, i);
    const candidateEmail = `${prefix}.${ln}@${domain}`;

    // Check if exists locally in DB
    const existsInDb = await prisma.onboardingTicket.findFirst({
      where: { companyEmailId: candidateEmail }
    });

    // Check if exists in IT Inventory / Active Directory / Snipe-IT
    const existsInInventory = await ITInventoryService.checkEmailExists(candidateEmail);

    if (!existsInDb && !existsInInventory) {
      companyEmailId = candidateEmail;
      isUnique = true;
      break;
    }
  }

  // 2. Fallback: append incrementing number to full first name if all prefixes are taken
  if (!isUnique) {
    let counter = 1;
    while (!isUnique) {
      const candidateEmail = `${fn}${counter}.${ln}@${domain}`;

      const existsInDb = await prisma.onboardingTicket.findFirst({
        where: { companyEmailId: candidateEmail }
      });

      const existsInInventory = await ITInventoryService.checkEmailExists(candidateEmail);

      if (!existsInDb && !existsInInventory) {
        companyEmailId = candidateEmail;
        isUnique = true;
        break;
      }
      counter++;
    }
  }

  return companyEmailId;
};

export const generateEmail = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, company } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and Last name are required.' });
    }
    const generatedEmail = await helperGenerateEmail(firstName, lastName, company || 'Eastern Enterprise.com');
    res.status(200).json({ success: true, email: generatedEmail });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createTicket = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const company = data.company || 'Eastern Enterprise.com';
    let companyEmailId = data.companyEmailId;

    if (!companyEmailId) {
      companyEmailId = await helperGenerateEmail(data.firstName, data.lastName, company);
    } else {
      // Double check email uniqueness just in case (to prevent race conditions)
      const existsInDb = await prisma.onboardingTicket.findFirst({
        where: { companyEmailId }
      });
      const existsInInventory = await ITInventoryService.checkEmailExists(companyEmailId);
      if (existsInDb || existsInInventory) {
        // Re-generate if someone took it in between
        companyEmailId = await helperGenerateEmail(data.firstName, data.lastName, company);
      }
    }

    // Generate unique values
    const ticketCount = await prisma.onboardingTicket.count();
    const ticketNumber = `TKT-${new Date().getFullYear()}-${String(ticketCount + 1).padStart(4, '0')}`;
    const employeeId = `EMP${String(ticketCount + 1001).padStart(4, '0')}`;
    const username = companyEmailId.split('@')[0];

    const newTicket = await prisma.onboardingTicket.create({
      data: {
        ...data,
        doj: new Date(data.doj),
        ticketNumber,
        employeeId,
        username,
        companyEmailId,
        company,
        status: 'HR Verification',
        hrDetails: { create: {} },
        itDetails: { create: {} },
        assetDetails: { create: {} },
        dispatchDetails: { create: {} },
        qaDetails: { create: {} },
        hardwareRequest: { create: {} },
        activityLogs: {
          create: {
            userId: req.user?.id,
            action: 'Ticket Created',
            details: `TA Team submitted onboarding request. Selected company: ${company}. Generated email: ${companyEmailId}`,
          }
        }
      }
    });

    // Auto-create user in Snipe-IT in the background
    const snipeResult = await SnipeITService.createUser({
      ...data,
      username,
      companyEmailId,
      company,
      employeeId
    });

    if (snipeResult.success) {
      await prisma.activityLog.create({
        data: {
          ticketId: newTicket.id,
          userId: req.user?.id,
          action: 'Snipe-IT User Created',
          details: `Successfully auto-created user ${username} in Snipe-IT (ID: ${snipeResult.snipeItUserId})`
        }
      });
    } else {
      await prisma.activityLog.create({
        data: {
          ticketId: newTicket.id,
          userId: req.user?.id,
          action: 'Snipe-IT Auto-Creation Failed',
          details: `Failed to auto-create user in Snipe-IT: ${snipeResult.message}`
        }
      });
    }

    res.status(201).json({ success: true, ticket: newTicket });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTickets = async (req: Request, res: Response) => {
  try {
    const { status, department } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (department) filter.department = department;

    const tickets = await prisma.onboardingTicket.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      include: {
        hardwareRequest: true
      }
    });

    res.status(200).json({ success: true, tickets });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTicketById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.onboardingTicket.findUnique({
      where: { id: Number(id) },
      include: {
        hrDetails: true,
        itDetails: true,
        assetDetails: true,
        dispatchDetails: true,
        qaDetails: true,
        hardwareRequest: true,
        credentialSheet: true,
        activityLogs: {
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    res.status(200).json({ success: true, ticket });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTicketStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const ticketId = Number(id);

    const ticket = await prisma.onboardingTicket.findUnique({
      where: { id: ticketId },
      include: {
        hrDetails: true,
        itDetails: true,
        assetDetails: true,
        dispatchDetails: true,
        qaDetails: true,
        credentialSheet: true
      }
    });

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const currentStatus = ticket.status;

    // Strict Stage transition validations matching the updated HR workflow
    
    // 1. Transitioning from HR Verification to IT & Asset Preparation
    if (currentStatus === 'HR Verification' && status === 'IT & Asset Preparation') {
      const hr = ticket.hrDetails;
      const isBgvCleared = hr?.bgvStatus === 'Cleared';
      const isExceptionApproved = hr?.approved && hr?.bgvProof && hr?.bgvExceptionReason;

      if (!isBgvCleared && !isExceptionApproved) {
        return res.status(400).json({ error: 'Transition Blocked: BGV verification must be Cleared, OR Exception Approval must be approved with uploaded proof and reason.' });
      }
    }

    // 2. Transitioning from IT & Asset Preparation to Dispatch
    if (currentStatus === 'IT & Asset Preparation' && status === 'Dispatch') {
      const it = ticket.itDetails;
      const asset = ticket.assetDetails;
      const isItComplete = it && it.adCreated && it.o365LicenseAssigned && it.mfaEnabled;
      const isAssetComplete = asset && asset.hostname && asset.serialNumber && asset.assetTag && asset.assignedEngineer;
      const isCredUploaded = !!ticket.credentialSheet;
      const isGetpassUploaded = !!(asset?.getpassUploaded);
      const isHandoverSelected = !!(asset?.handoverType);

      if (!isItComplete || !isAssetComplete || !isCredUploaded) {
        return res.status(400).json({ error: 'Transition Blocked: IT Account Creation (AD, MFA, License), Asset details (Hostname, Serial, Tag, Engineer), and the Credential Handover Package must be fully completed.' });
      }

      if (!isHandoverSelected) {
        return res.status(400).json({ error: 'Transition Blocked: Hardware Handover Type (Office / Courier) must be selected before dispatch.' });
      }

      if (!isGetpassUploaded) {
        return res.status(400).json({ error: 'Transition Blocked: GetPass Credential Package must be uploaded by the Asset team before dispatch.' });
      }
    }

    // 3. Transitioning from Dispatch to Joined
    if (currentStatus === 'Dispatch' && status === 'Joined') {
      const dispatch = ticket.dispatchDetails;
      const qa = ticket.qaDetails;
      const hr = ticket.hrDetails;
      const handoverType = ticket.assetDetails?.handoverType;

      const isQaComplete = qa && qa.serialNumberVerified && qa.osConfigured && qa.softwareInstalled;
      if (!isQaComplete) {
        return res.status(400).json({ error: 'Transition Blocked: QA Verification checklist must be fully completed.' });
      }

      // Courier vs Office handover logic
      if (handoverType === 'COURIER') {
        const hasCourierInfo = dispatch && dispatch.courierVendor && dispatch.trackingId && dispatch.dispatchDate;
        const isDelivered = dispatch && dispatch.deliveryStatus === 'Delivered';
        if (!hasCourierInfo || !isDelivered) {
          return res.status(400).json({ error: 'Transition Blocked: Courier Handover requires Courier Vendor, Tracking Number, Dispatch Date, and Delivery Status marked as "Delivered".' });
        }
      }

      // Enforce DOJ lock
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const doj = new Date(ticket.doj);
      doj.setHours(0, 0, 0, 0);
      if (doj > today) {
        return res.status(400).json({ error: `Transition Blocked: Task remains locked. Marking as Joined is only enabled on or after DOJ: ${doj.toLocaleDateString()}.` });
      }

      // Induction Schedule & Employee ID fields must be completed
      const isInductionSet = hr && hr.inductionSchedule && hr.meetingLink && hr.hrCoordinator;
      const isEmployeeIdSet = ticket.kekaEmployeeId && ticket.kekaEmployeeId.trim() !== '';

      if (!isInductionSet || !isEmployeeIdSet) {
        return res.status(400).json({ error: 'Transition Blocked: Induction Schedule and Keka Employee ID are mandatory on DOJ before transitioning to Joined.' });
      }
    }

    // Protect direct skips or invalid backward moves
    if (status === 'Joined' && currentStatus !== 'Dispatch') {
      return res.status(400).json({ error: `Transition Blocked: Cannot transition to Joined directly from "${currentStatus}".` });
    }

    const updatedTicket = await prisma.onboardingTicket.update({
      where: { id: ticketId },
      data: {
        status,
        activityLogs: {
          create: {
            userId: req.user?.id,
            action: `Status updated from "${currentStatus}" to "${status}"`,
            details: remarks || '',
          }
        }
      }
    });

    res.status(200).json({ success: true, ticket: updatedTicket });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateHardwareConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { hardwareModel, hardwareComment } = req.body;

    if (!hardwareModel) {
      return res.status(400).json({ error: 'Hardware model is required.' });
    }

    if (hardwareModel.toLowerCase().includes('other') && !hardwareComment) {
      return res.status(400).json({ error: 'Comment is required for custom hardware specification.' });
    }

    const updatedRequest = await prisma.hardwareRequest.update({
      where: { ticketId: Number(id) },
      data: {
        hardwareModel,
        hardwareComment,
        hardwareStatus: 'SUBMITTED',
      }
    });

    await prisma.activityLog.create({
      data: {
        ticketId: Number(id),
        userId: req.user?.id,
        action: 'Hardware Selected',
        details: `Hardware configuration selected by TA: ${hardwareModel}${hardwareComment ? ` (${hardwareComment})` : ''}`,
      }
    });

    res.status(200).json({ success: true, hardwareRequest: updatedRequest });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const searchInventoryUsers = async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    const users = await SnipeITService.searchUsers(query);
    res.status(200).json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
