import { Router } from 'express';
import { resolveTenantBranding } from '../controllers/tenant.controller';

const router = Router();

// Public route to resolve company branding by hostname or slug
router.get('/resolve', resolveTenantBranding);

export default router;
