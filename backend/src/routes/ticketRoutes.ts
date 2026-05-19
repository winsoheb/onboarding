import { Router } from 'express';
import { createTicket, getTickets, getTicketById, updateTicketStatus, generateEmail, updateHardwareConfig, searchInventoryUsers } from '../controllers/ticketController';
import { authenticate, requireRole } from '../middlewares/auth';

const router = Router();

// Apply authentication to all routes below
router.use(authenticate);

// TA & Admin can create
router.post('/generate-email', requireRole(['TA']), generateEmail);
router.get('/search-users', requireRole(['TA']), searchInventoryUsers);
router.post('/', requireRole(['TA']), createTicket);
router.patch('/:id/hardware', requireRole(['TA']), updateHardwareConfig);

// Everyone can view tickets (can add more granular filtering inside controller)
router.get('/', getTickets);
router.get('/:id', getTicketById);

// Updating status requires specific roles depending on the stage, but here we simplify
// Granular checks should happen inside controllers ideally, or split routes per module
router.put('/:id/status', requireRole(['TA', 'HR', 'IT_ADMIN', 'ASSET', 'DISPATCH', 'QA', 'SUPPORT']), updateTicketStatus);

export default router;
