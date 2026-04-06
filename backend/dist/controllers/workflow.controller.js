"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPriorities = exports.reorderStatuses = exports.createStatus = exports.getStatuses = void 0;
const db_1 = __importDefault(require("../config/db"));
// GET /api/workflow/statuses
const getStatuses = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(403).json({ message: 'No company attached to user' });
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
        if (!companyId)
            return;
        const { name, color } = req.body;
        // Find highest orderIndex
        const highest = await db_1.default.customTaskStatus.findFirst({
            where: { companyId },
            orderBy: { orderIndex: 'desc' },
        });
        const orderIndex = highest ? highest.orderIndex + 1 : 1;
        const status = await db_1.default.customTaskStatus.create({
            data: {
                companyId,
                name,
                color,
                orderIndex,
                isDefault: false
            }
        });
        res.status(201).json(status);
    }
    catch (error) {
        console.error('createStatus error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createStatus = createStatus;
// PUT /api/workflow/statuses/reorder
const reorderStatuses = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId)
            return;
        const { updates } = req.body;
        await db_1.default.$transaction(updates.map((u) => db_1.default.customTaskStatus.update({
            where: { id: u.id, companyId },
            data: { orderIndex: u.orderIndex }
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
        if (!companyId)
            return;
        const priorities = await db_1.default.customTaskPriority.findMany({
            where: { companyId },
            orderBy: { orderIndex: 'asc' }
        });
        res.json(priorities);
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getPriorities = getPriorities;
//# sourceMappingURL=workflow.controller.js.map