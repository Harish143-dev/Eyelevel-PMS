import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { logActivity } from '../services/activity.service';
import { Role } from '../config/roles';

// --- SALARY MANAGEMENT ---

// GET /api/payroll/salaries  (HR only)
export const getAllSalaries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const salaries = await prisma.salary.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, designation: true } }
      }
    });
    res.json({ salaries });
  } catch (error) {
    console.error('Get salaries error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/payroll/salaries/:userId
export const getSalaryByUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;

    // Users can only view their own salary, HR/Admins can view anyone's
    if (req.user!.role === Role.EMPLOYEE && req.user!.id !== userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const salary = await prisma.salary.findUnique({
      where: { userId },
      include: {
        user: { select: { name: true, designation: true } }
      }
    });

    if (!salary) {
      res.status(404).json({ message: 'Salary configuration not found for user' });
      return;
    }

    res.json({ salary });
  } catch (error) {
    console.error('Get salary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/payroll/salaries/:userId (HR/Admin only)
export const updateSalary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    const { baseSalary, hra, otherAllowances, pfDeduction, esiDeduction, taxDeduction } = req.body;

    const salary = await prisma.salary.upsert({
      where: { userId },
      update: { baseSalary, hra, otherAllowances, pfDeduction, esiDeduction, taxDeduction },
      create: { userId, baseSalary, hra, otherAllowances, pfDeduction, esiDeduction, taxDeduction }
    });

    await logActivity(req.user!.id, 'SALARY_UPDATED', 'employee', userId, `Updated salary configuration for user`);

    res.json({ salary });
  } catch (error) {
    console.error('Update salary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// --- PAYSLIP MANAGEMENT ---

// POST /api/payroll/payslips/generate (HR only)
export const generatePayslip = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, month, year } = req.body;

    const salary = await prisma.salary.findUnique({ where: { userId } });
    if (!salary) {
      res.status(400).json({ message: 'Salary configuration not found for user' });
      return;
    }

    const grossPay = salary.baseSalary + salary.hra + salary.otherAllowances;
    const totalDeductions = salary.pfDeduction + salary.esiDeduction + salary.taxDeduction;
    const netPay = grossPay - totalDeductions;

    const payslip = await prisma.payslip.upsert({
      where: {
        userId_month_year: { userId, month, year }
      },
      update: {
        basic: salary.baseSalary,
        hra: salary.hra,
        allowances: salary.otherAllowances,
        grossPay,
        pf: salary.pfDeduction,
        esi: salary.esiDeduction,
        tax: salary.taxDeduction,
        totalDeductions,
        netPay,
        status: 'published'
      },
      create: {
        userId,
        month,
        year,
        basic: salary.baseSalary,
        hra: salary.hra,
        allowances: salary.otherAllowances,
        grossPay,
        pf: salary.pfDeduction,
        esi: salary.esiDeduction,
        tax: salary.taxDeduction,
        totalDeductions,
        netPay,
        status: 'published'
      }
    });

    res.status(201).json({ payslip });
  } catch (error) {
    console.error('Generate payslip error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/payroll/payslips/:userId
export const getPayslipsByUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;

    if (req.user!.role === Role.EMPLOYEE && req.user!.id !== userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const payslips = await prisma.payslip.findMany({
      where: { userId },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    });

    res.json({ payslips });
  } catch (error) {
    console.error('Get payslips error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
