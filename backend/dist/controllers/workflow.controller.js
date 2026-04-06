"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderPriorities = exports.deletePriority = exports.updatePriority = exports.createPriority = exports.getPriorities = exports.reorderStatuses = exports.deleteStatus = exports.updateStatus = exports.createStatus = exports.getStatuses = void 0;
const db_1 = __importDefault(require("../config/db"));
// GET /api/workflow/statuses
const getStatuses = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.json([]);
            return;
        }
        const statuses = await db_1.default.customTaskStatus.findMany({
            where: { companyId },
            orderBy: { orderIndex: 'asc' },
        });
        res.json(statuses);
    }
    catch (error) {
        console.error('getStatuses error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getStatuses = getStatuses;
// POST /api/workflow/statuses
const createStatus = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(400).json({ message: 'No company found' });
            return;
        }
        const { name, color, standardStatus } = req.body;
        if (!name || !color) {
            res.status(400).json({ message: 'Name and color are required' });
            return;
        }
        const highest = await db_1.default.customTaskStatus.findFirst({
            where: { companyId },
            orderBy: { orderIndex: 'desc' },
        });
        const orderIndex = highest ? highest.orderIndex + 1 : 1;
        const status = await db_1.default.customTaskStatus.create({
            data: { companyId, name, color, orderIndex, isDefault: false, standardStatus: standardStatus || 'ongoing' },
        });
        res.status(201).json(status);
    }
    catch (error) {
        console.error('createStatus error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createStatus = createStatus;
// PUT /api/workflow/statuses/:id
const updateStatus = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(400).json({ message: 'No company found' });
            return;
        }
        const id = req.params.id;
        const { name, color, standardStatus } = req.body;
        const existing = await db_1.default.customTaskStatus.findFirst({ where: { id, companyId } });
        if (!existing) {
            res.status(404).json({ message: 'Status not found' });
            return;
        }
        const updated = await db_1.default.customTaskStatus.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(color !== undefined && { color }),
                ...(standardStatus !== undefined && { standardStatus }),
            },
        });
        // If category changed, sync all tasks using this status
        if (standardStatus !== undefined && standardStatus !== existing.standardStatus) {
            await db_1.default.task.updateMany({
                where: { customStatusId: id },
                data: { status: standardStatus },
            });
        }
        res.json(updated);
    }
    catch (error) {
        console.error('updateStatus error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateStatus = updateStatus;
// DELETE /api/workflow/statuses/:id
const deleteStatus = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(400).json({ message: 'No company found' });
            return;
        }
        const id = req.params.id;
        const existing = await db_1.default.customTaskStatus.findFirst({ where: { id, companyId } });
        if (!existing) {
            res.status(404).json({ message: 'Status not found' });
            return;
        }
        // Move tasks using this custom status back to standard 'pending'
        await db_1.default.task.updateMany({
            where: { customStatusId: id },
            data: { customStatusId: null, status: 'pending' },
        });
        await db_1.default.customTaskStatus.delete({ where: { id } });
        res.json({ message: 'Status deleted. Tasks reverted to Pending.' });
    }
    catch (error) {
        console.error('deleteStatus error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteStatus = deleteStatus;
// PUT /api/workflow/statuses/reorder
const reorderStatuses = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId)
            return;
        const { updates } = req.body;
        await db_1.default.$transaction(updates.map((u) => db_1.default.customTaskStatus.update({
            where: { id: u.id, companyId },
            data: { orderIndex: u.orderIndex },
        })));
        res.json({ message: 'Reordered successfully' });
    }
    catch (error) {
        console.error('reorderStatuses error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.reorderStatuses = reorderStatuses;
// GET /api/workflow/priorities
const getPriorities = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.json([]);
            return;
        }
        const priorities = await db_1.default.customTaskPriority.findMany({
            where: { companyId },
            orderBy: { orderIndex: 'asc' },
        });
        res.json(priorities);
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getPriorities = getPriorities;
// POST /api/workflow/priorities
const createPriority = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(400).json({ message: 'No company found' });
            return;
        }
        const { name, color, icon } = req.body;
        if (!name || !color) {
            res.status(400).json({ message: 'Name and color are required' });
            return;
        }
        const highest = await db_1.default.customTaskPriority.findFirst({
            where: { companyId },
            orderBy: { orderIndex: 'desc' },
        });
        const orderIndex = highest ? highest.orderIndex + 1 : 1;
        const priority = await db_1.default.customTaskPriority.create({
            data: { companyId, name, color, icon: icon || null, orderIndex },
        });
        res.status(201).json(priority);
    }
    catch (error) {
        console.error('createPriority error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createPriority = createPriority;
// PUT /api/workflow/priorities/:id
const updatePriority = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(400).json({ message: 'No company found' });
            return;
        }
        const id = req.params.id;
        const { name, color, icon } = req.body;
        const existing = await db_1.default.customTaskPriority.findFirst({ where: { id, companyId } });
        if (!existing) {
            res.status(404).json({ message: 'Priority not found' });
            return;
        }
        const updated = await db_1.default.customTaskPriority.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(color !== undefined && { color }),
                ...(icon !== undefined && { icon }),
            },
        });
        res.json(updated);
    }
    catch (error) {
        console.error('updatePriority error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updatePriority = updatePriority;
// DELETE /api/workflow/priorities/:id
const deletePriority = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(400).json({ message: 'No company found' });
            return;
        }
        const id = req.params.id;
        const existing = await db_1.default.customTaskPriority.findFirst({ where: { id, companyId } });
        if (!existing) {
            res.status(404).json({ message: 'Priority not found' });
            return;
        }
        // Move tasks using this custom priority back to standard 'medium'
        await db_1.default.task.updateMany({
            where: { customPriorityId: id },
            data: { customPriorityId: null, priority: 'medium' },
        });
        await db_1.default.customTaskPriority.delete({ where: { id } });
        res.json({ message: 'Priority deleted. Tasks reverted to Medium.' });
    }
    catch (error) {
        console.error('deletePriority error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deletePriority = deletePriority;
// PUT /api/workflow/priorities/reorder
const reorderPriorities = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId)
            return;
        const { updates } = req.body;
        await db_1.default.$transaction(updates.map((u) => db_1.default.customTaskPriority.update({
            where: { id: u.id, companyId },
            data: { orderIndex: u.orderIndex },
        })));
        res.json({ message: 'Reordered successfully' });
    }
    catch (error) {
        console.error('reorderPriorities error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.reorderPriorities = reorderPriorities;
//# sourceMappingURL=workflow.controller.js.map