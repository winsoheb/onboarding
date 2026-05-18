import { Request, Response } from 'express';
import prisma from '../utils/prismaClient';

export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    const totalRequests = await prisma.onboardingTicket.count();
    
    const pendingHR = await prisma.onboardingTicket.count({ where: { status: 'HR Verification' } });
    const pendingIT = await prisma.onboardingTicket.count({ where: { status: 'IT Account Creation' } });
    const pendingAsset = await prisma.onboardingTicket.count({ where: { status: 'Asset Preparation' } });
    
    // Example query for upcoming joining this week
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const upcomingJoining = await prisma.onboardingTicket.count({
      where: {
        doj: {
          gte: today,
          lte: nextWeek,
        }
      }
    });

    res.status(200).json({
      success: true,
      metrics: {
        totalRequests,
        pendingHR,
        pendingIT,
        pendingAsset,
        upcomingJoining
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
