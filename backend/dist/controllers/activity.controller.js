"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivities = void 0;
const db_1 = __importDefault(require("../config/db"));
// GET /api/activity
const getActivities = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const userScope = req.user;
        if (!userScope || !userScope.companyId) {
            res.status(400).json({ error: 'No company attached to admin context' });
            return;
        }
        const { companyId } = userScope;
        const [activities, total] = await Promise.all([
            db_1.default.activityLog.findMany({
                where: { user: { companyId } },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, name: true, avatarColor: true, email: true } },
                },
            }),
            db_1.default.activityLog.count({ where: { user: { companyId } } }),
        ]);
        res.json({
            activities,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error('Get activities error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getActivities = getActivities;
//# sourceMappingURL=activity.controller.js.map