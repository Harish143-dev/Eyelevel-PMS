"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.resetPassword = exports.forgotPassword = exports.refresh = exports.logout = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = __importDefault(require("../config/db"));
const email_service_1 = require("../services/email.service");
const activity_service_1 = require("../services/activity.service");
const security_1 = require("../utils/security");
const AVATAR_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];
const generateAccessToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, name: user.name, companyId: user.companyId || null }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
};
const generateRefreshToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, name: user.name, companyId: user.companyId || null }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};
const roles_1 = require("../config/roles");
const permissions_1 = require("../config/permissions");
const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w-]+/g, '') // Remove all non-word chars
        .replace(/--+/g, '-'); // Replace multiple - with single -
};
// POST /api/auth/register
const register = async (req, res, next) => {
    try {
        const { name, email, password, companyName } = req.body;
        if (!name || !email || !password || !companyName) {
            res.status(400).json({ message: 'Name, email, password, and workspace name are required' });
            return;
        }
        if (companyName.trim().length < 2) {
            res.status(400).json({ message: 'Workspace name must be at least 2 characters' });
            return;
        }
        const normalizedEmail = email.toLowerCase().trim();
        const existing = await db_1.default.user.findUnique({ where: { email: normalizedEmail } });
        if (existing) {
            res.status(409).json({ message: 'Email already registered' });
            return;
        }
        // Enforce password policy
        const policyCheck = await (0, security_1.validatePasswordWithSettings)(password, null);
        if (!policyCheck.valid) {
            res.status(400).json({ message: policyCheck.message });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
        // Create Company and linked User in a transaction
        const result = await db_1.default.$transaction(async (tx) => {
            // 1. Create Company
            let slug = slugify(companyName);
            // Check if slug exists, if so append random string
            const existingCompany = await tx.company.findUnique({ where: { slug } });
            if (existingCompany) {
                slug = `${slug}-${crypto_1.default.randomBytes(2).toString('hex')}`;
            }
            const company = await tx.company.create({
                data: {
                    name: companyName.trim(),
                    slug,
                    features: permissions_1.DefaultFeatures,
                    setupStep: 1, // Start at branding personalization
                    settings: {
                        create: {
                            timezone: 'UTC',
                            currency: 'USD',
                        },
                    },
                },
            });
            // 2. Create User
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    passwordHash,
                    avatarColor,
                    role: roles_1.Role.ADMIN,
                    status: 'ACTIVE',
                    companyId: company.id,
                },
            });
            // 3. Seed Default System Roles for this company
            const roleNames = ['Admin', 'Manager', 'HR', 'Employee'];
            let adminRoleId = null;
            for (const roleName of roleNames) {
                const key = roleName.toLowerCase();
                const role = await tx.role.create({
                    data: {
                        companyId: company.id,
                        name: roleName,
                        permissions: permissions_1.DefaultRolePermissions[key] || [],
                        isSystemRole: true,
                    },
                });
                if (roleName === 'Admin')
                    adminRoleId = role.id;
            }
            // 4. Update User with admin role record
            await tx.user.update({
                where: { id: user.id },
                data: { roleId: adminRoleId },
            });
            // 5. Seed Default Task Statuses
            const defaultStatuses = [
                { name: 'Backlog', color: '#6B7280', orderIndex: 1, isDefault: true },
                { name: 'To Do', color: '#3B82F6', orderIndex: 2, isDefault: true },
                { name: 'In Progress', color: '#F59E0B', orderIndex: 3, isDefault: true },
                { name: 'QA', color: '#8B5CF6', orderIndex: 4, isDefault: true },
                { name: 'Done', color: '#10B981', orderIndex: 5, isDefault: true }
            ];
            await tx.customTaskStatus.createMany({
                data: defaultStatuses.map(s => ({ ...s, companyId: company.id }))
            });
            // 6. Seed Default Task Priorities
            const defaultPriorities = [
                { name: 'Low', color: '#9CA3AF', icon: 'chevron-down', orderIndex: 1 },
                { name: 'Medium', color: '#3B82F6', icon: 'minus', orderIndex: 2 },
                { name: 'High', color: '#F59E0B', icon: 'chevron-up', orderIndex: 3 },
                { name: 'Urgent', color: '#EF4444', icon: 'alert-circle', orderIndex: 4 }
            ];
            await tx.customTaskPriority.createMany({
                data: defaultPriorities.map(p => ({ ...p, companyId: company.id }))
            });
            return { user, company };
        });
        const { user, company } = result;
        await (0, activity_service_1.logActivity)(user.id, 'USER_REGISTERED', 'employee', user.id, `${user.name} registered and created workspace ${company.name}`);
        // Generate tokens
        const accessToken = generateAccessToken({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            companyId: user.companyId
        });
        const refreshToken = generateRefreshToken({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            companyId: user.companyId
        });
        const hashedRefreshToken = await bcryptjs_1.default.hash(refreshToken, 10);
        await db_1.default.user.update({
            where: { id: user.id },
            data: { refreshToken: hashedRefreshToken },
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(201).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                avatarColor: user.avatarColor,
                companyId: user.companyId,
                company: {
                    id: company.id,
                    name: company.name,
                    setupCompleted: company.setupCompleted,
                    setupStep: company.setupStep,
                }
            },
            accessToken
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
// POST /api/auth/login
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }
        const normalizedEmail = email.toLowerCase().trim();
        const user = await db_1.default.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        // Check user status
        if (user.status === 'PENDING') {
            res.status(403).json({ message: 'Your account is pending approval. Please wait for an admin to activate your account.' });
            return;
        }
        if (user.status === 'REJECTED') {
            res.status(403).json({ message: 'Your account has been rejected. Contact admin for details.' });
            return;
        }
        if (user.status === 'INACTIVE' || !user.isActive) {
            res.status(403).json({ message: 'Account is deactivated. Contact admin.' });
            return;
        }
        const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!valid) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        // Check for 2FA requirement
        if (user.companyId) {
            const companySettings = await db_1.default.companySettings.findUnique({
                where: { companyId: user.companyId },
                select: { require2fa: true }
            });
            if (companySettings?.require2fa && !user.twoFactorEnabled) {
                // Here we just flag it for now, can be used by frontend to redirect to 2FA setup
                // or prevent full login until 2FA is verified.
                // res.status(403).json({ message: 'Two-factor authentication is required for your workspace. Please set it up.', require2fa: true });
                // return;
            }
        }
        const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role, name: user.name, companyId: user.companyId });
        const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role, name: user.name, companyId: user.companyId });
        const hashedRefreshToken = await bcryptjs_1.default.hash(refreshToken, 10);
        await db_1.default.user.update({
            where: { id: user.id },
            data: { refreshToken: hashedRefreshToken },
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        await (0, activity_service_1.logActivity)(user.id, 'USER_LOGGED_IN', 'employee', user.id, `${user.name} logged in`, req.ip);
        if (user.companyId) {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const existingRecord = await db_1.default.employeeMonitoring.findFirst({
                where: { userId: user.id, companyId: user.companyId, date: today }
            });
            if (!existingRecord) {
                await db_1.default.employeeMonitoring.create({
                    data: {
                        userId: user.id,
                        companyId: user.companyId,
                        date: today,
                        firstLoginAt: new Date(),
                        ipAddress: req.ip || '',
                        userAgent: req.headers['user-agent'] || '',
                    }
                });
            }
            else {
                await db_1.default.employeeMonitoring.update({
                    where: { id: existingRecord.id },
                    data: { lastLogoutAt: new Date() }
                });
            }
        }
        // Fetch company data so frontend ProtectedRoute can check setupCompleted
        let company = null;
        if (user.companyId) {
            company = await db_1.default.company.findUnique({
                where: { id: user.companyId },
                select: {
                    id: true,
                    name: true,
                    setupCompleted: true,
                    setupStep: true,
                    features: true,
                    settings: {
                        select: { primaryColor: true, logoUrl: true, city: true, state: true, country: true, sessionTimeout: true, require2fa: true }
                    }
                }
            });
        }
        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                avatarColor: user.avatarColor,
                designation: user.designation,
                monitoringConsentShown: user.monitoringConsentShown,
                companyId: user.companyId,
                company,
            },
            accessToken,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
// POST /api/auth/logout
const logout = async (req, res, next) => {
    try {
        if (req.user) {
            const user = await db_1.default.user.findUnique({ where: { id: req.user.id } });
            await db_1.default.user.update({
                where: { id: req.user.id },
                data: { refreshToken: null },
            });
            if (user?.companyId) {
                const today = new Date();
                today.setUTCHours(0, 0, 0, 0);
                const existingRecord = await db_1.default.employeeMonitoring.findFirst({
                    where: { userId: user.id, companyId: user.companyId, date: today }
                });
                if (existingRecord) {
                    await db_1.default.employeeMonitoring.update({
                        where: { id: existingRecord.id },
                        data: { lastLogoutAt: new Date() }
                    });
                }
            }
        }
        res.clearCookie('refreshToken');
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
// POST /api/auth/refresh
const refresh = async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) {
            res.status(401).json({ message: 'Refresh token required' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET);
        const user = await db_1.default.user.findUnique({ where: { id: decoded.id } });
        if (!user || !user.isActive || user.status !== 'ACTIVE' || !user.refreshToken) {
            res.status(401).json({ message: 'Invalid refresh token' });
            return;
        }
        const isValidToken = await bcryptjs_1.default.compare(token, user.refreshToken);
        if (!isValidToken) {
            res.status(401).json({ message: 'Invalid refresh token' });
            return;
        }
        const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role, name: user.name, companyId: user.companyId });
        const newRefreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role, name: user.name, companyId: user.companyId });
        const hashedNewToken = await bcryptjs_1.default.hash(newRefreshToken, 10);
        await db_1.default.user.update({
            where: { id: user.id },
            data: { refreshToken: hashedNewToken },
        });
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.json({ accessToken });
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};
exports.refresh = refresh;
// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ message: 'Email is required' });
            return;
        }
        const user = await db_1.default.user.findUnique({ where: { email } });
        // Always return success to prevent email enumeration
        if (!user) {
            res.json({ message: 'If the email exists, a reset link has been sent.' });
            return;
        }
        // Block password resets for inactive, rejected, or pending accounts
        if (user.status !== 'ACTIVE' || !user.isActive) {
            // Return the same generic message to prevent account status enumeration
            res.json({ message: 'If the email exists, a reset link has been sent.' });
            return;
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await db_1.default.user.update({
            where: { id: user.id },
            data: { resetToken, resetTokenExpiry },
        });
        try {
            await (0, email_service_1.sendResetPasswordEmail)(email, resetToken);
        }
        catch (emailError) {
            console.error('Email send error:', emailError);
        }
        res.json({ message: 'If the email exists, a reset link has been sent.' });
    }
    catch (error) {
        next(error);
    }
};
exports.forgotPassword = forgotPassword;
// POST /api/auth/reset-password/:token
const resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        // Enforce company password policy
        const userToReset = await db_1.default.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: { gt: new Date() },
            },
        });
        if (!userToReset) {
            res.status(400).json({ message: 'Invalid or expired reset token' });
            return;
        }
        const policyCheck = await (0, security_1.validatePasswordWithSettings)(password, userToReset.companyId);
        if (!policyCheck.valid) {
            res.status(400).json({ message: policyCheck.message });
            return;
        }
        const user = await db_1.default.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: { gt: new Date() },
            },
        });
        if (!user) {
            res.status(400).json({ message: 'Invalid or expired reset token' });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        await db_1.default.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });
        res.json({ message: 'Password reset successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.resetPassword = resetPassword;
// GET /api/auth/me
const getMe = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            console.error('getMe error: No user in request despite verifyJWT');
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        console.log(`getMe: Fetching profile for user ID: ${req.user.id}`);
        const user = await db_1.default.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                avatarColor: true,
                designation: true,
                isActive: true,
                companyId: true,
                createdAt: true,
                company: {
                    select: {
                        id: true,
                        name: true,
                        setupCompleted: true,
                        setupStep: true,
                        features: true,
                        settings: {
                            select: {
                                primaryColor: true,
                                logoUrl: true,
                                city: true,
                                state: true,
                                country: true,
                                sessionTimeout: true,
                                require2fa: true
                            }
                        }
                    },
                },
            },
        });
        if (!user) {
            console.warn(`getMe: User with ID ${req.user.id} not found in database`);
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            message: 'Failed to retrieve profile data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.getMe = getMe;
//# sourceMappingURL=auth.controller.js.map