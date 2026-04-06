import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { Permission } from '../config/permissions';
import { checkFeature } from '../middleware/feature.middleware';
import {
  getCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  getCustomFieldValues,
  upsertCustomFieldValues
} from '../controllers/customField.controller';

const router = Router();

// Apply auth middleware to all routes
router.use(verifyJWT);
router.use(checkFeature('customFields'));

// Definitions CRUD (Admins only / COMPANY_SETTINGS permission)
router.get('/', checkPermission(Permission.COMPANY_SETTINGS), getCustomFields);
router.post('/', checkPermission(Permission.COMPANY_SETTINGS), createCustomField);
router.put('/:id', checkPermission(Permission.COMPANY_SETTINGS), updateCustomField);
router.delete('/:id', checkPermission(Permission.COMPANY_SETTINGS), deleteCustomField);

// Values (accessible to anyone with read/write access to the respective entities)
// For MVP, we will allow all authenticated users in the company to view and edit custom field values.
router.get('/values/:entityId', getCustomFieldValues);
router.post('/values', upsertCustomFieldValues);

export default router;
