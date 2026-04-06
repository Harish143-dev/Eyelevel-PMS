import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/todos
export const getTodos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter = req.query.filter as string; // 'all' | 'active' | 'completed'
    const sortBy = req.query.sortBy as string; // 'due_date' | 'priority' | 'created_at'

    const whereClause: any = { userId: req.user!.id };
    if (filter === 'active') whereClause.isDone = false;
    if (filter === 'completed') whereClause.isDone = true;

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'due_date') orderBy = { dueDate: 'asc' };
    if (sortBy === 'priority') orderBy = { priority: 'asc' };

    const todos = await prisma.todo.findMany({
      where: whereClause,
      orderBy,
    });

    res.json({ todos });
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/todos
export const createTodo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, priority, dueDate } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ message: 'Title is required' });
      return;
    }

    const todo = await prisma.todo.create({
      data: {
        userId: req.user!.id,
        title: title.trim(),
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    res.status(201).json({ todo });
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/todos/:id
export const updateTodo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, isDone, priority, dueDate } = req.body;

    const existing = await prisma.todo.findUnique({ where: { id: id as string } });
    if (!existing || existing.userId !== req.user!.id) {
      res.status(404).json({ message: 'Todo not found' });
      return;
    }

    const todo = await prisma.todo.update({
      where: { id: id as string },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        isDone: isDone !== undefined ? isDone : undefined,
        priority: priority || undefined,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
      },
    });

    res.json({ todo });
  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/todos/:id
export const deleteTodo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.todo.findUnique({ where: { id: id as string } });
    if (!existing || existing.userId !== req.user!.id) {
      res.status(404).json({ message: 'Todo not found' });
      return;
    }

    await prisma.todo.delete({ where: { id: id as string } });

    res.json({ message: 'Todo deleted' });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
