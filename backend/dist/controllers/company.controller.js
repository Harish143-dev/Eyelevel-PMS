"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyCompany = exports.updateCompanyStatus = exports.updateCompanyFeatures = exports.getCompanyById = exports.getCompanies = void 0;
const db_1 = __importDefault(require("../config/db"));
const activity_service_1 = require("../services/activity.service");
/**
 * GET /api/companies
 * List all companies (super admin / platform admin).
 */
const getCompanies = async (req, res) => {
    try {
        const companies = await db_1.default.company.findMany({
            include: {
                _count: { select: { users: true, projects: true } },
                settings: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ companies });
    }
    catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getCompanies = getCompanies;
/**
 * GET /api/companies/:id
 * Get a single company's details.
 */
const getCompanyById = async (req, res) => {
    try {
        const { id } = req.params;
        const company = await db_1.default.company.findUnique({
            where: { id: id },
            include: {
                settings: true,
                _count: { select: { users: true, projects: true, departments: true } },
            },
        });
        if (!company) {
            res.status(404).json({ message: 'Company not found' });
            return;
        }
        res.json({ company });
    }
    catch (error) {
        console.error('Get company error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getCompanyById = getCompanyById;
/**
 * PATCH /api/companies/:id/features
 * Toggle features for a company.
 * Body: { features: { projectManagement: true, teamChat: false, ... } }
 */
const updateCompanyFeatures = async (req, res) => {
    try {
        const { id } = req.params;
        const { features } = req.body;
        if (!features || typeof features !== 'object') {
            res.status(400).json({ message: 'Features object is required' });
            return;
        }
        const company = await db_1.default.company.findUnique({ where: { id: id } });
        if (!company) {
            res.status(404).json({ message: 'Company not found' });
            return;
        }
        // Merge with existing features
        const currentFeatures = company.features || {};
        const mergedFeatures = { ...currentFeatures, ...features };
        const updated = await db_1.default.company.update({
            where: { id: id },
            data: { features: mergedFeatures },
            include: { _count: { select: { users: true, projects: true } } },
        });
        await (0, activity_service_1.logActivity)(req.user.id, 'FEATURES_UPDATED', 'company', id, `Updated features for "${updated.name}"`);
        res.json({ company: updated, message: 'Features updated successfully' });
    }
    catch (error) {
        console.error('Update company features error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateCompanyFeatures = updateCompanyFeatures;
/**
 * PATCH /api/companies/:id/status
 * Update a company's status (active, suspended, etc.)
 * Body: { status }
 */
const updateCompanyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status || !['active', 'suspended', 'inactive'].includes(status)) {
            res.status(400).json({ message: 'Valid status is required (active, suspended, inactive)' });
            return;
        }
        const updated = await db_1.default.company.update({
            where: { id: id },
            data: { status },
        });
        await (0, activity_service_1.logActivity)(req.user.id, 'COMPANY_STATUS_CHANGED', 'company', id, `Changed company "${updated.name}" status to ${status}`);
        res.json({ company: updated, message: `Company status updated to ${status}` });
    }
    catch (error) {
        console.error('Update company status error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateCompanyStatus = updateCompanyStatus;
/**
 * GET /api/companies/my
 * Get the current user's company with full details.
 */
const getMyCompany = async (req, res) => {
    try {
        const user = await db_1.default.user.findUnique({
            where: { id: req.user.id },
            select: { companyId: true },
        });
        if (!user?.companyId) {
            res.status(404).json({ message: 'No company found' });
            return;
        }
        const company = await db_1.default.company.findUnique({
            where: { id: user.companyId },
            include: {
                settings: true,
                _count: { select: { users: true, projects: true, departments: true, roles: true } },
            },
        });
        res.json({ company });
    }
    catch (error) {
        console.error('Get my company error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getMyCompany = getMyCompany;
//# sourceMappingURL=company.controller.js.map