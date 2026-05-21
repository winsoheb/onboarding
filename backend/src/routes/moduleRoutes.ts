import { Router } from 'express';
import { updateHRDetails, updateITDetails, updateAssetDetails, updateDispatchDetails, updateQADetails, updateKekaDetails, getAvailableLicenses, getDeployableAssetsRoute, uploadCredentialSheet, validateAsset, uploadGetPass } from '../controllers/moduleController';
import { authenticate, requireRole } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/inventory/licenses', requireRole(['IT_ADMIN', 'SUPER_ADMIN']), getAvailableLicenses);
router.get('/inventory/deployable', requireRole(['ASSET', 'SUPER_ADMIN']), getDeployableAssetsRoute);
router.get('/asset/validate', requireRole(['ASSET', 'SUPER_ADMIN']), validateAsset);
router.put('/:id/hr', requireRole(['HR']), updateHRDetails);
router.put('/:id/it', requireRole(['IT_ADMIN']), updateITDetails);
router.put('/:id/credentials', requireRole(['IT_ADMIN']), uploadCredentialSheet);
router.put('/:id/asset', requireRole(['ASSET']), updateAssetDetails);
router.put('/:id/getpass', requireRole(['ASSET']), uploadGetPass);
router.put('/:id/dispatch', requireRole(['DISPATCH']), updateDispatchDetails);
router.put('/:id/qa', requireRole(['QA']), updateQADetails);
router.put('/:id/keka', requireRole(['HR']), updateKekaDetails);

export default router;

