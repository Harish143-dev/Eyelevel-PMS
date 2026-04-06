"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMilestone = exports.updateMilestone = exports.getProjectMilestones = exports.createMilestone = void 0;
const db_1 = __importDefault(require("../config/db"));
const notification_service_1 = require("../services/notification.service");
const roles_1 = require("../config/roles");
const createMilestone = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const { title, description, dueDate, status } = req.body;
        const project = await db_1.default.project.findUnique({ where: { id: projectId } });
        if (!project || project.isDeleted) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        // Authorization: only members
        if (!roles_1.RoleGroups.STAFF.includes(req.user.role)) {
            const membership = await db_1.default.projectMember.findFirst({
                where: { projectId, userId: req.user.id },
            });
            if (!membership) {
                res.status(403).json({ message: 'You are not a member of this project' });
                return;
            }
        }
        // Verify milestone due date is not after project deadline
        if (dueDate && project.deadline) {
            const milestoneDate = new Date(dueDate);
            const projectDate = new Date(project.deadline);
            if (milestoneDate > projectDate) {
                res.status(400).json({
                    message: `Milestone due date (${milestoneDate.toLocaleDateString()}) cannot be after project deadline (${projectDate.toLocaleDateString()})`
                });
                return;
            }
        }
        const milestone = await db_1.default.milestone.create({
            data: {
                projectId,
                title,
                description,
                status: status || 'pending',
                dueDate: dueDate ? new Date(dueDate) : null
            }
        });
        res.status(201).json({ milestone });
    }
    catch (error) {
        console.error('Create milestone error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createMilestone = createMilestone;
const getProjectMilestones = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const milestones = await db_1.default.milestone.findMany({
            where: { projectId },
            include: {
                tasks: { select: { id: true, title: true, status: true, dueDate: true } }
            },
            orderBy: { dueDate: 'asc' }
        });
        res.json({ milestones });
    }
    catch (error) {
        console.error('Get milestones error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getProjectMilestones = getProjectMilestones;
const updateMilestone = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, dueDate, status } = req.body;
        // Fetch existing to detect status change
        const existing = await db_1.default.milestone.findUnique({ where: { id: id } });
        if (!existing) {
            res.status(404).json({ message: 'Milestone not found' });
            return;
        }
        // Fetch project for deadline validation and authorization
        const project = await db_1.default.project.findUnique({ where: { id: existing.projectId } });
        // Authorization: only members
        if (!roles_1.RoleGroups.STAFF.includes(req.user.role)) {
            const membership = await db_1.default.projectMember.findFirst({
                where: { projectId: existing.projectId, userId: req.user.id },
            });
            if (!membership) {
                res.status(403).json({ message: 'You are not authorized to edit this milestone' });
                return;
            }
        }
        // Verify milestone due date is not after project deadline
        if (dueDate && project?.deadline) {
            const milestoneDate = new Date(dueDate);
            const projectDate = new Date(project.deadline);
            if (milestoneDate > projectDate) {
                res.status(400).json({
                    message: `Milestone due date (${milestoneDate.toLocaleDateString()}) cannot be after project deadline (${projectDate.toLocaleDateString()})`
                });
                return;
            }
        }
        const milestone = await db_1.default.milestone.update({
            where: { id: id },
            data: {
                title,
                description,
                status,
                dueDate: dueDate ? new Date(dueDate) : null
            }
        });
        // If status just changed to completed, notify all project members
        if (status === 'completed' && existing && existing.status !== 'completed') {
            try {
                await (0, notification_service_1.notifyMilestoneCompleted)(milestone.projectId, milestone.title, req.user.name);
            }
            catch (e) {
                console.error('Failed to send milestone notification:', e);
            }
        }
        res.json({ milestone });
    }
    catch (error) {
        console.error('Update milestone error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateMilestone = updateMilestone;
const deleteMilestone = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.milestone.delete({ where: { id: id } });
        res.json({ message: 'Milestone deleted successfully' });
    }
    catch (error) {
        console.error('Delete milestone error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteMilestone = deleteMilestone;
//# sourceMappingURL=milestone.controller.js.map