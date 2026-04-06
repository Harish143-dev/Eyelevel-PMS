import { Router } from 'express';
import {
  getCompanies,
  getCompanyById,
  updateCompanyFeatures,
  updateCompanyStatus,
  getMyCompany,
} from '../controllers/company.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { Permission } from '../config/permissions';

const router = Router();

router.use(verifyJWT);

// Current user's company
router.get('/my', getMyCompany);

// Super admin / platform routes
router.get('/', checkPermission(Permission.COMPANY_MANAGE), getCompanies);
router.get('/:id', checkPermission(Permission.COMPANY_MANAGE), getCompanyById);
router.patch('/:id/features', checkPermission(Permission.FEATURE_TOGGLE), updateCompanyFeatures);
router.patch('/:id/status', checkPermission(Permission.COMPANY_MANAGE), updateCompanyStatus);

export default router;
