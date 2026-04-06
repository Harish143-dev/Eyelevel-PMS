import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * GET /api/roles
 * Lists all roles for the user's company.
 */
export declare const getRoles: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * GET /api/roles/:id
 * Get a single role by ID.
 */
export declare const getRoleById: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * POST /api/roles
 * Create a new custom role.
 * Body: { name, permissions }
 */
export declare const createRole: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * PUT /api/roles/:id
 * Update a role's name and/or permissions.
 * Body: { name?, permissions? }
 */
export declare const updateRole: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * DELETE /api/roles/:id
 * Delete a custom role. System roles cannot be deleted.
 */
export declare const deleteRole: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=role.controller.d.ts.map