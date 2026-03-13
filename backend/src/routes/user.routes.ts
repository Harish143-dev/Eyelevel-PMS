import { Router } from 'express';
import { getUsers, getUserById, createUser, updateUser, updateUserRole, updateUserStatus, updatePassword } from '../controllers/user.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.use(verifyJWT);

router.get('/', requireRole('admin'), getUsers);
router.get('/:id', getUserById);
router.post('/', requireRole('admin'), createUser);
router.put('/:id', updateUser);
router.patch('/:id/password', updatePassword);
router.patch('/:id/role', requireRole('admin'), updateUserRole);
router.patch('/:id/status', requireRole('admin'), updateUserStatus);

export default router;
