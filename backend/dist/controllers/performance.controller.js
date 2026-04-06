"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReview = exports.getReviews = exports.deleteOKR = exports.updateOKR = exports.createOKR = exports.getOKRs = void 0;
const db_1 = __importDefault(require("../config/db"));
const activity_service_1 = require("../services/activity.service");
const roles_1 = require("../config/roles");
// --- OKRs ---
const getOKRs = async (req, res) => {
    try {
        const { userId } = req.query;
        // User can only view their own OKRs unless HR/Manager/Admin
        const role = req.user.role;
        const canViewAll = roles_1.RoleGroups.STAFF.includes(role);
        const whereClause = {};
        if (!canViewAll) {
            whereClause.userId = req.user.id;
        }
        else if (userId) {
            whereClause.userId = userId;
        }
        const okrs = await db_1.default.oKR.findMany({
            where: whereClause,
            include: {
                user: { select: { name: true, avatarColor: true, designation: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ okrs });
    }
    catch (error) {
        console.error('Get OKRs error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getOKRs = getOKRs;
const createOKR = async (req, res) => {
    try {
        const { userId, title, description, quarter } = req.body;
        // Only HR/Manager/Admin can create OKRs for others
        const role = req.user.role;
        const isSelf = req.user.id === userId;
        const canManage = roles_1.RoleGroups.STAFF.includes(role);
        if (!isSelf && !canManage) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        const okr = await db_1.default.oKR.create({
            data: { userId, title, description, quarter, progress: 0 }
        });
        await (0, activity_service_1.logActivity)(req.user.id, 'OKR_CREATED', 'okr', okr.id, `Created OKR: ${title}`);
        res.status(201).json({ okr });
    }
    catch (error) {
        console.error('Create OKR error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createOKR = createOKR;
const updateOKR = async (req, res) => {
    try {
        const { id } = req.params;
        const okrId = id;
        const { title, description, quarter, progress, status } = req.body;
        const existing = await db_1.default.oKR.findUnique({ where: { id: okrId } });
        if (!existing) {
            res.status(404).json({ message: 'OKR not found' });
            return;
        }
        const role = req.user.role;
        const isSelf = req.user.id === existing.userId;
        const canManage = roles_1.RoleGroups.STAFF.includes(role);
        if (!isSelf && !canManage) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        const okr = await db_1.default.oKR.update({
            where: { id: okrId },
            data: { title, description, quarter, progress, status }
        });
        res.json({ okr });
    }
    catch (error) {
        console.error('Update OKR error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateOKR = updateOKR;
const deleteOKR = async (req, res) => {
    try {
        const { id } = req.params;
        const okrId = id;
        const role = req.user.role;
        if (!roles_1.RoleGroups.STAFF.includes(role)) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        await db_1.default.oKR.delete({ where: { id: okrId } });
        res.json({ message: 'OKR deleted' });
    }
    catch (error) {
        console.error('Delete OKR error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteOKR = deleteOKR;
// --- Performance Reviews ---
const getReviews = async (req, res) => {
    try {
        const { revieweeId } = req.query;
        const role = req.user.role;
        const canViewAll = roles_1.RoleGroups.STAFF.includes(role);
        const whereClause = {};
        if (!canViewAll) {
            // Employees can only view their own reviews
            whereClause.revieweeId = req.user.id;
        }
        else if (revieweeId) {
            whereClause.revieweeId = revieweeId;
        }
        const reviews = await db_1.default.performanceReview.findMany({
            where: whereClause,
            include: {
                reviewee: { select: { name: true, avatarColor: true } },
                reviewer: { select: { name: true, avatarColor: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ reviews });
    }
    catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getReviews = getReviews;
const createReview = async (req, res) => {
    try {
        const { revieweeId, period, rating, feedback } = req.body;
        const reviewerId = req.user.id;
        const role = req.user.role;
        if (!roles_1.RoleGroups.STAFF.includes(role)) {
            res.status(403).json({ message: 'Only managers and HR can create reviews' });
            return;
        }
        const review = await db_1.default.performanceReview.create({
            data: { revieweeId, reviewerId, period, rating: Number(rating), feedback, status: 'published' }
        });
        await (0, activity_service_1.logActivity)(req.user.id, 'REVIEW_CREATED', 'review', review.id, `Created Performance Review for ${period}`);
        res.status(201).json({ review });
    }
    catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createReview = createReview;
//# sourceMappingURL=performance.controller.js.map