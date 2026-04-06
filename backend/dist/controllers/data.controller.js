"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportEmployees = exports.exportProjects = exports.exportTasks = void 0;
const db_1 = __importDefault(require("../config/db"));
const exportTasks = async (req, res) => {
    try {
        const tasks = await db_1.default.task.findMany({
            where: { companyId: req.user.companyId, isDeleted: false },
            include: {
                project: { select: { name: true } },
                assignee: { select: { name: true, email: true } },
                customStatus: { select: { name: true } },
                customPriority: { select: { name: true } },
            }
        });
        const csvLines = [
            'ID,Title,Status,Priority,AssignedTo,DueDate,ProjectName'
        ];
        tasks.forEach((task) => {
            const statusTitle = task.customStatus?.name || task.status;
            const priorityTitle = task.customPriority?.name || task.priority;
            const dueDateStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '';
            csvLines.push(`${task.id},"${task.title}",${statusTitle},${priorityTitle},"${task.assignee?.name || ''}",${dueDateStr},"${task.project?.name || ''}"`);
        });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=tasks_export.csv');
        res.status(200).send(csvLines.join('\n'));
    }
    catch (error) {
        console.error('Task export error:', error);
        res.status(500).json({ message: 'Failed to export tasks' });
    }
};
exports.exportTasks = exportTasks;
const exportProjects = async (req, res) => {
    try {
        const projects = await db_1.default.project.findMany({
            where: { companyId: req.user.companyId, isDeleted: false },
        });
        const csvLines = ['ID,Name,Status,StartDate,Deadline'];
        projects.forEach((p) => {
            const startStr = p.startDate ? new Date(p.startDate).toLocaleDateString() : '';
            const finishStr = p.deadline ? new Date(p.deadline).toLocaleDateString() : '';
            csvLines.push(`${p.id},"${p.name}",${p.status},${startStr},${finishStr}`);
        });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=projects_export.csv');
        res.status(200).send(csvLines.join('\n'));
    }
    catch (error) {
        console.error('Project export error:', error);
        res.status(500).json({ message: 'Failed to export projects' });
    }
};
exports.exportProjects = exportProjects;
const exportEmployees = async (req, res) => {
    try {
        const users = await db_1.default.user.findMany({
            where: { companyId: req.user.companyId, isDeleted: false },
            include: {
                department: { select: { name: true } }
            }
        });
        const csvLines = ['ID,Name,Email,Role,Department,JoinDate'];
        users.forEach((u) => {
            const joinStr = u.joiningDate ? new Date(u.joiningDate).toLocaleDateString() : '';
            csvLines.push(`${u.id},"${u.name}",${u.email},${u.role},"${u.department?.name || ''}",${joinStr}`);
        });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=employees_export.csv');
        res.status(200).send(csvLines.join('\n'));
    }
    catch (error) {
        console.error('Employee export error:', error);
        res.status(500).json({ message: 'Failed to export employees' });
    }
};
exports.exportEmployees = exportEmployees;
//# sourceMappingURL=data.controller.js.map