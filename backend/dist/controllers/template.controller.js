"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTemplate = exports.updateTemplate = exports.createTemplateFromProject = exports.createTemplate = exports.getTemplateById = exports.getTemplates = void 0;
const db_1 = __importDefault(require("../config/db"));
// GET /api/templates
const getTemplates = async (req, res) => {
    try {
        const templates = await db_1.default.projectTemplate.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json({ templates });
    }
    catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getTemplates = getTemplates;
// GET /api/templates/:id
const getTemplateById = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await db_1.default.projectTemplate.findUnique({
            where: { id: id },
        });
        if (!template) {
            res.status(404).json({ message: 'Template not found' });
            return;
        }
        res.json({ template });
    }
    catch (error) {
        console.error('Get template error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getTemplateById = getTemplateById;
// POST /api/templates
const createTemplate = async (req, res) => {
    try {
        const { name, description, category, tasks, milestones } = req.body;
        if (!name) {
            res.status(400).json({ message: 'Template name is required' });
            return;
        }
        const template = await db_1.default.projectTemplate.create({
            data: {
                name,
                description: description || null,
                category: category || null,
                tasks: tasks || [],
                milestones: milestones || [],
                createdBy: req.user.id,
            },
        });
        res.status(201).json({ template });
    }
    catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createTemplate = createTemplate;
// POST /api/templates/from-project/:projectId — save existing project as template
const createTemplateFromProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name } = req.body;
        const project = await db_1.default.project.findUnique({
            where: { id: projectId },
            include: {
                tasks: {
                    where: { parentTaskId: null },
                    select: { title: true, description: true, priority: true, status: true },
                    orderBy: { position: 'asc' },
                },
                milestones: {
                    select: { title: true, description: true },
                    orderBy: { position: 'asc' },
                },
            },
        });
        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        const templateTasks = project.tasks.map((t) => ({
            title: t.title,
            description: t.description,
            priority: t.priority,
        }));
        const templateMilestones = project.milestones?.map((m) => ({
            title: m.title,
            description: m.description,
        })) || [];
        const template = await db_1.default.projectTemplate.create({
            data: {
                name: name || `${project.name} Template`,
                description: project.description,
                category: project.category,
                tasks: templateTasks,
                milestones: templateMilestones,
                createdBy: req.user.id,
            },
        });
        res.status(201).json({ template });
    }
    catch (error) {
        console.error('Create template from project error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createTemplateFromProject = createTemplateFromProject;
// PUT /api/templates/:id
const updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, category, tasks, milestones } = req.body;
        const template = await db_1.default.projectTemplate.update({
            where: { id: id },
            data: {
                name,
                description,
                category,
                tasks,
                milestones,
            },
        });
        res.json({ template });
    }
    catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateTemplate = updateTemplate;
// DELETE /api/templates/:id
const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.projectTemplate.delete({
            where: { id: id },
        });
        res.json({ message: 'Template deleted successfully' });
    }
    catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteTemplate = deleteTemplate;
//# sourceMappingURL=template.controller.js.map