"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTenantBranding = void 0;
const db_1 = __importDefault(require("../config/db"));
/**
 * GET /api/tenant/resolve
 * Resolves a tenant by either hostname (custom domain) or subdomain (slug).
 */
const resolveTenantBranding = async (req, res, next) => {
    try {
        const { hostname, slug } = req.query;
        if (!hostname && !slug) {
            res.status(400).json({ message: 'Hostname or slug is required' });
            return;
        }
        let company = null;
        // 1. Try to resolve by custom domain (hostname)
        if (hostname && typeof hostname === 'string') {
            company = await db_1.default.company.findUnique({
                where: { customDomain: hostname.toLowerCase() },
                select: {
                    id: true,
                    name: true,
                    settings: {
                        select: {
                            logoUrl: true,
                            primaryColor: true,
                        }
                    }
                }
            });
        }
        // 2. Fallback to resolve by slug (subdomain) if hostname didn't match or wasn't provided
        if (!company && slug && typeof slug === 'string') {
            company = await db_1.default.company.findUnique({
                where: { slug: slug.toLowerCase() },
                select: {
                    id: true,
                    name: true,
                    settings: {
                        select: {
                            logoUrl: true,
                            primaryColor: true,
                        }
                    }
                }
            });
        }
        if (!company) {
            res.status(404).json({ message: 'Tenant not found' });
            return;
        }
        res.json({
            name: company.name,
            logoUrl: company.settings?.logoUrl || null,
            primaryColor: company.settings?.primaryColor || '#6366f1'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.resolveTenantBranding = resolveTenantBranding;
//# sourceMappingURL=tenant.controller.js.map