import { Request, Response } from 'express';
import prisma from '../utils/prismaClient';
import { ActiveDirectoryService, MicrosoftGraphService, SnipeITService } from '../services/mockApis';

export const updateHRDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { bgvStatus, documentsUploaded, inductionSchedule, approved } = req.body;

    const hr = await prisma.hRDetails.update({
      where: { ticketId: Number(id) },
      data: { bgvStatus, documentsUploaded, inductionSchedule: inductionSchedule ? new Date(inductionSchedule) : null, approved }
    });

    await prisma.activityLog.create({
      data: { ticketId: Number(id), userId: req.user?.id, action: 'HR Details Updated', details: `BGV: ${bgvStatus}, Approved: ${approved}` }
    });

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
    // (A real app would check previous state to avoid double calls)
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
    const data = req.body;

    const asset = await prisma.assetDetails.update({
      where: { ticketId: Number(id) },
      data
    });

    if (data.assetTag) {
      await SnipeITService.assignAsset(999, data.assetTag); // Mock user ID 999
    }

    await prisma.activityLog.create({
      data: { ticketId: Number(id), userId: req.user?.id, action: 'Asset Details Updated', details: `Assigned Asset Tag: ${data.assetTag || 'None'}` }
    });

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
