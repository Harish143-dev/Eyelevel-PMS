"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRole = exports.updateRole = exports.createRole = exports.getRoleById = exports.getRoles = void 0;
const db_1 = __importDefault(require("../config/db"));
const activity_service_1 = require("../services/activity.service");
/**
 * GET /api/roles
 * Lists all roles for the user's company.
 */
const getRoles = async (req, res) => {
    try {
        const user = await db_1.default.user.findUnique({
            where: { id: req.user.id },
            select: { companyId: true },
        });
        const where = {};
        if (user?.companyId) {
            // Show company-specific roles + global system roles
            where.OR = [
                { companyId: user.companyId },
                { companyId: null, isSystemRole: true },
            ];
        }
        else {
            where.isSystemRole = true;
        }
        const roles = await db_1.default.role.findMany({
            where,
            include: {
                _count: { select: { users: true } },
            },
            orderBy: [{ isSystemRole: 'desc' }, { name: 'asc' }],
        });
        res.json({ roles });
    }
    catch (error) {
        console.error('Get roles error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getRoles = getRoles;
/**
 * GET /api/roles/:id
 * Get a single role by ID.
 */
const getRoleById = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await db_1.default.role.findUnique({
            where: { id: id },
            include: {
                _count: { select: { users: true } },
            },
        });
        if (!role) {
            res.status(404).json({ message: 'Role not found' });
            return;
        }
        res.json({ role });
    }
    catch (error) {
        console.error('Get role error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getRoleById = getRoleById;
/**
 * POST /api/roles
 * Create a new custom role.
 * Body: { name, permissions }
 */
const createRole = async (req, res) => {
    try {
        const { name, permissions } = req.body;
        if (!name || name.trim().length < 2) {
            res.status(400).json({ message: 'Role name is required (min 2 characters)' });
            return;
        }
        const user = await db_1.default.user.findUnique({
            where: { id: req.user.id },
            select: { companyId: true },
        });
        if (!user?.companyId) {
            res.status(400).json({ message: 'No company found. Complete onboarding first.' });
            return;
        }
        // Check for duplicate name within the company
        const existing = await db_1.default.role.findFirst({
            where: { companyId: user.companyId, name: { equals: name.trim(), mode: 'insensitive' } },
        });
        if (existing) {
            res.status(409).json({ message: 'A role with this name already exists' });
            return;
        }
        const role = await db_1.default.role.create({
            data: {
                companyId: user.companyId,
                name: name.trim(),
                permissions: Array.isArray(permissions) ? permissions : [],
                isSystemRole: false,
            },
            include: {
                _count: { select: { users: true } },
            },
        });
        await (0, activity_service_1.logActivity)(req.user.id, 'ROLE_CREATED', 'role', role.id, `Created role "${role.name}"`);
        res.status(201).json({ role, message: 'Role created successfully' });
    }
    catch (error) {
        console.error('Create role error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createRole = createRole;
/**
 * PUT /api/roles/:id
 * Update a role's name and/or permissions.
 * Body: { name?, permissions? }
 */
const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, permissions } = req.body;
        const existing = await db_1.default.role.findUnique({ where: { id: id } });
        if (!existing) {
            res.status(404).json({ message: 'Role not found' });
            return;
        }
        // System roles can have permissions updated, but not renamed
        if (existing.isSystemRole && name && name !== existing.name) {
            res.status(400).json({ message: 'System roles cannot be renamed' });
            return;
        }
        const data = {};
        if (name)
            data.name = name.trim();
        if (Array.isArray(permissions))
            data.permissions = permissions;
        const role = await db_1.default.role.update({
            where: { id: id },
            data,
            include: {
                _count: { select: { users: true } },
            },
        });
        await (0, activity_service_1.logActivity)(req.user.id, 'ROLE_UPDATED', 'role', role.id, `Updated role "${role.name}"`);
        res.json({ role, message: 'Role updated successfully' });
    }
    catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateRole = updateRole;
/**
 * DELETE /api/roles/:id
 * Delete a custom role. System roles cannot be deleted.
 */
const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await db_1.default.role.findUnique({
            where: { id: id },
            include: { _count: { select: { users: true } } },
        });
        if (!existing) {
            res.status(404).json({ message: 'Role not found' });
            return;
        }
        if (existing.isSystemRole) {
            res.status(400).json({ message: 'System roles cannot be deleted' });
            return;
        }
        if (existing._count.users > 0) {
            res.status(400).json({
                message: `Cannot delete role "${existing.name}" — it is assigned to ${existing._count.users} user(s). Reassign them first.`,
            });
            return;
        }
        await db_1.default.role.delete({ where: { id: id } });
        await (0, activity_service_1.logActivity)(req.user.id, 'ROLE_DELETED', 'role', id, `Deleted role "${existing.name}"`);
        res.json({ message: 'Role deleted successfully' });
    }
    catch (error) {
        console.error('Delete role error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteRole = deleteRole;
//# sourceMappingURL=role.controller.js.map