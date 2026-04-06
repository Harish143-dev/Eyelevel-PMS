import { Router } from 'express';
import { getClients, getClientById, createClient, updateClient, deleteClient } from '../controllers/client.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { checkFeature } from '../middleware/feature.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { Permission } from '../config/permissions';

import { Role } from '../config/roles';

const router = Router();

// Protect all routes
router.use(verifyJWT);
router.use(checkFeature('clientManagement'));

router.get('/', checkPermission(Permission.CLIENT_VIEW), getClients);
router.get('/:id', checkPermission(Permission.CLIENT_VIEW), getClientById);

// Admin / Super Admin / Manager / HR only
router.post('/', requireRole(Role.ADMIN, Role.MANAGER, Role.HR), checkPermission(Permission.CLIENT_CREATE), createClient);
router.put('/:id', requireRole(Role.ADMIN, Role.MANAGER, Role.HR), checkPermission(Permission.CLIENT_EDIT), updateClient);
router.delete('/:id', requireRole(Role.ADMIN, Role.MANAGER), checkPermission(Permission.CLIENT_DELETE), deleteClient);

export default router;
