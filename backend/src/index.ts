import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import ticketRoutes from './routes/ticketRoutes';
import moduleRoutes from './routes/moduleRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import prisma from './utils/prismaClient';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'SBQ Onboarding Backend Running' });
});

// Routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/dashboard', dashboardRoutes);

const PORT = process.env.PORT || 5000;

async function seedDefaultUser() {
  try {
    await prisma.user.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        email: 'admin@easternenterprise.com',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
      }
    });
    console.log('Default Super Admin user seeded successfully!');
  } catch (err) {
    console.error('Failed to seed default user:', err);
  }
}

async function seedLicenses() {
  try {
    const licenseCount = await prisma.licenseInventory.count();
    if (licenseCount === 0) {
      console.log('Seeding available licenses into Inventory...');
      const licenseMappings = [
        { type: 'SBQ-Basic', id: 37 },
        { type: 'SBQ-Standard', id: 88 },
        { type: 'EE-Standard', id: 55 },
        { type: 'EE-Basic', id: 56 }
      ];

      for (const mapping of licenseMappings) {
        // Seed 10 licenses of each type
        for (let i = 1; i <= 10; i++) {
          const key = `${mapping.type}-${String(i).padStart(3, '0')}`;
          await prisma.licenseInventory.create({
            data: {
              licenseKey: key,
              licenseType: mapping.type,
              snipeItLicenseId: mapping.id,
              status: 'Available'
            }
          });
        }
      }
      console.log('Seeded 40 licenses successfully into inventory!');
    }
  } catch (err) {
    console.error('Failed to seed licenses inventory:', err);
  }
}

app.listen(PORT, async () => {
  await seedDefaultUser();
  await seedLicenses();
  console.log(`Server running on port ${PORT}`);
});
