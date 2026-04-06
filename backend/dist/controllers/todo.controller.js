"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTodo = exports.updateTodo = exports.createTodo = exports.getTodos = void 0;
const db_1 = __importDefault(require("../config/db"));
// GET /api/todos
const getTodos = async (req, res) => {
    try {
        const filter = req.query.filter; // 'all' | 'active' | 'completed'
        const sortBy = req.query.sortBy; // 'due_date' | 'priority' | 'created_at'
        const whereClause = { userId: req.user.id };
        if (filter === 'active')
            whereClause.isDone = false;
        if (filter === 'completed')
            whereClause.isDone = true;
        let orderBy = { createdAt: 'desc' };
        if (sortBy === 'due_date')
            orderBy = { dueDate: 'asc' };
        if (sortBy === 'priority')
            orderBy = { priority: 'asc' };
        const todos = await db_1.default.todo.findMany({
            where: whereClause,
            orderBy,
        });
        res.json({ todos });
    }
    catch (error) {
        console.error('Get todos error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getTodos = getTodos;
// POST /api/todos
const createTodo = async (req, res) => {
    try {
        const { title, priority, dueDate } = req.body;
        if (!title || !title.trim()) {
            res.status(400).json({ message: 'Title is required' });
            return;
        }
        const todo = await db_1.default.todo.create({
            data: {
                userId: req.user.id,
                title: title.trim(),
                priority: priority || 'MEDIUM',
                dueDate: dueDate ? new Date(dueDate) : null,
            },
        });
        res.status(201).json({ todo });
    }
    catch (error) {
        console.error('Create todo error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createTodo = createTodo;
// PATCH /api/todos/:id
const updateTodo = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, isDone, priority, dueDate } = req.body;
        const existing = await db_1.default.todo.findUnique({ where: { id: id } });
        if (!existing || existing.userId !== req.user.id) {
            res.status(404).json({ message: 'Todo not found' });
            return;
        }
        const todo = await db_1.default.todo.update({
            where: { id: id },
            data: {
                title: title !== undefined ? title.trim() : undefined,
                isDone: isDone !== undefined ? isDone : undefined,
                priority: priority || undefined,
                dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
            },
        });
        res.json({ todo });
    }
    catch (error) {
        console.error('Update todo error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateTodo = updateTodo;
// DELETE /api/todos/:id
const deleteTodo = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await db_1.default.todo.findUnique({ where: { id: id } });
        if (!existing || existing.userId !== req.user.id) {
            res.status(404).json({ message: 'Todo not found' });
            return;
        }
        await db_1.default.todo.delete({ where: { id: id } });
        res.json({ message: 'Todo deleted' });
    }
    catch (error) {
        console.error('Delete todo error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteTodo = deleteTodo;
//# sourceMappingURL=todo.controller.js.map