"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchAll = void 0;
const db_1 = __importDefault(require("../config/db"));
const roles_1 = require("../config/roles");
// GET /api/search?q=query
const searchAll = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query || query.length < 2) {
            res.json({ projects: [], tasks: [] });
            return;
        }
        const isUser = req.user.role === roles_1.Role.EMPLOYEE;
        const memberCondition = isUser ? { members: { some: { userId: req.user.id } } } : {};
        // Search Projects
        const projects = await db_1.default.project.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { name: { contains: query, mode: 'insensitive' } },
                            { description: { contains: query, mode: 'insensitive' } },
                        ],
                    },
                    memberCondition
                ]
            },
            select: {
                id: true,
                name: true,
                category: true,
                status: true,
            },
            take: 5,
        });
        // Search Tasks (only parent tasks)
        const tasks = await db_1.default.task.findMany({
            where: {
                parentTaskId: null,
                AND: [
                    {
                        OR: [
                            { title: { contains: query, mode: 'insensitive' } },
                            { description: { contains: query, mode: 'insensitive' } },
                        ],
                    },
                    isUser ? { project: { members: { some: { userId: req.user.id } } } } : {}
                ]
            },
            select: {
                id: true,
                title: true,
                status: true,
                projectId: true,
                project: { select: { name: true } },
            },
            take: 5,
        });
        res.json({ projects, tasks });
    }
    catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.searchAll = searchAll;
//# sourceMappingURL=search.controller.js.map