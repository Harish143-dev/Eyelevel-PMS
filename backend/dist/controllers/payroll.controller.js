"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPayslipsByUser = exports.generatePayslip = exports.updateSalary = exports.getSalaryByUser = exports.getAllSalaries = void 0;
const db_1 = __importDefault(require("../config/db"));
const activity_service_1 = require("../services/activity.service");
const roles_1 = require("../config/roles");
// --- SALARY MANAGEMENT ---
// GET /api/payroll/salaries  (HR only)
const getAllSalaries = async (req, res) => {
    try {
        const salaries = await db_1.default.salary.findMany({
            include: {
                user: { select: { id: true, name: true, email: true, designation: true } }
            }
        });
        res.json({ salaries });
    }
    catch (error) {
        console.error('Get salaries error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAllSalaries = getAllSalaries;
// GET /api/payroll/salaries/:userId
const getSalaryByUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        // Users can only view their own salary, HR/Admins can view anyone's
        if (req.user.role === roles_1.Role.EMPLOYEE && req.user.id !== userId) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        const salary = await db_1.default.salary.findUnique({
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
    }
    catch (error) {
        console.error('Get salary error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getSalaryByUser = getSalaryByUser;
// PUT /api/payroll/salaries/:userId (HR/Admin only)
const updateSalary = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { baseSalary, hra, otherAllowances, pfDeduction, esiDeduction, taxDeduction } = req.body;
        const salary = await db_1.default.salary.upsert({
            where: { userId },
            update: { baseSalary, hra, otherAllowances, pfDeduction, esiDeduction, taxDeduction },
            create: { userId, baseSalary, hra, otherAllowances, pfDeduction, esiDeduction, taxDeduction }
        });
        await (0, activity_service_1.logActivity)(req.user.id, 'SALARY_UPDATED', 'employee', userId, `Updated salary configuration for user`);
        res.json({ salary });
    }
    catch (error) {
        console.error('Update salary error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateSalary = updateSalary;
// --- PAYSLIP MANAGEMENT ---
// POST /api/payroll/payslips/generate (HR only)
const generatePayslip = async (req, res) => {
    try {
        const { userId, month, year } = req.body;
        const salary = await db_1.default.salary.findUnique({ where: { userId } });
        if (!salary) {
            res.status(400).json({ message: 'Salary configuration not found for user' });
            return;
        }
        const grossPay = salary.baseSalary + salary.hra + salary.otherAllowances;
        const totalDeductions = salary.pfDeduction + salary.esiDeduction + salary.taxDeduction;
        const netPay = grossPay - totalDeductions;
        const payslip = await db_1.default.payslip.upsert({
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
    }
    catch (error) {
        console.error('Generate payslip error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.generatePayslip = generatePayslip;
// GET /api/payroll/payslips/:userId
const getPayslipsByUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        if (req.user.role === roles_1.Role.EMPLOYEE && req.user.id !== userId) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        const payslips = await db_1.default.payslip.findMany({
            where: { userId },
            orderBy: [
                { year: 'desc' },
                { month: 'desc' }
            ]
        });
        res.json({ payslips });
    }
    catch (error) {
        console.error('Get payslips error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getPayslipsByUser = getPayslipsByUser;
//# sourceMappingURL=payroll.controller.js.map