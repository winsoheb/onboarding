import { Request, Response } from 'express';
import prisma from '../utils/prismaClient';
import { ITInventoryService } from '../services/mockApis';

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
        activityLogs: {
          create: {
            userId: req.user?.id,
            action: 'Ticket Created',
            details: `TA Team submitted onboarding request. Selected company: ${company}. Generated email: ${companyEmailId}`,
          }
        }
      }
    });

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

    const updatedTicket = await prisma.onboardingTicket.update({
      where: { id: Number(id) },
      data: {
        status,
        activityLogs: {
          create: {
            userId: req.user?.id,
            action: `Status updated to ${status}`,
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
