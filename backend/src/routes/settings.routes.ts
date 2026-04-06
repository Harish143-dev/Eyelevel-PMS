import { Router } from 'express';
import { getCompanySettings, updateCompanySettings, updateFeatures } from '../controllers/settings.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { Permission } from '../config/permissions';

const router = Router();

router.use(verifyJWT);

// Only admins / authorized users with COMPANY_SETTINGS should be able to alter company wide settings
router.get('/company', checkPermission(Permission.COMPANY_SETTINGS), getCompanySettings);
router.put('/company', checkPermission(Permission.COMPANY_SETTINGS), updateCompanySettings);
router.patch('/company/features', checkPermission(Permission.COMPANY_SETTINGS), updateFeatures);

export default router;
