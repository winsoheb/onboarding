import { Router } from 'express';
import { updateHRDetails, updateITDetails, updateAssetDetails, updateDispatchDetails, updateQADetails, updateKekaDetails } from '../controllers/moduleController';
import { authenticate, requireRole } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.put('/:id/hr', requireRole(['HR']), updateHRDetails);
router.put('/:id/it', requireRole(['IT_ADMIN']), updateITDetails);
router.put('/:id/asset', requireRole(['ASSET']), updateAssetDetails);
router.put('/:id/dispatch', requireRole(['DISPATCH']), updateDispatchDetails);
router.put('/:id/qa', requireRole(['QA']), updateQADetails);
router.put('/:id/keka', requireRole(['HR']), updateKekaDetails);

export default router;
