import { Router } from 'express';
import { searchAll } from '../controllers/search.controller';
import { verifyJWT as authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, searchAll);

export default router;
