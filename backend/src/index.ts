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

app.listen(PORT, async () => {
  await seedDefaultUser();
  console.log(`Server running on port ${PORT}`);
});
