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
const AVATAR_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];
const generateAccessToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
};
const generateRefreshToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};
const roles_1 = require("../config/roles");
// POST /api/auth/register
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ message: 'Name, email, and password are required' });
            return;
        }
        const existing = await db_1.default.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ message: 'Email already registered' });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
        const userCount = await db_1.default.user.count();
        const isFirstUser = userCount === 0;
        const user = await db_1.default.user.create({
            data: {
                name,
                email,
                passwordHash,
                avatarColor,
                // First user becomes admin and is auto-ACTIVE
                role: isFirstUser ? roles_1.Role.ADMIN : roles_1.Role.EMPLOYEE,
                status: isFirstUser ? 'ACTIVE' : 'PENDING',
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                avatarColor: true,
                createdAt: true,
            },
        });
        await (0, activity_service_1.logActivity)(user.id, 'USER_REGISTERED', 'employee', user.id, `${user.name} registered`);
        // If user is PENDING, don't issue tokens — just inform them
        if (user.status === 'PENDING') {
            res.status(201).json({
                message: 'Your account is pending approval. Please wait for an admin to activate your account.',
                pending: true,
            });
            return;
        }
        // First user (super_admin) gets auto-logged in
        const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role, name: user.name });
        const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role, name: user.name });
        const hashedRefreshToken = await bcryptjs_1.default.hash(refreshToken, 10);
        await db_1.default.user.update({
            where: { id: user.id },
            data: { refreshToken: hashedRefreshToken },
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.status(201).json({ user, accessToken });
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.register = register;
// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }
        const user = await db_1.default.user.findUnique({ where: { email } });
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
        const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role, name: user.name });
        const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role, name: user.name });
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
            },
            accessToken,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.login = login;
// POST /api/auth/logout
const logout = async (req, res) => {
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
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.logout = logout;
// POST /api/auth/refresh
const refresh = async (req, res) => {
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
        const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role, name: user.name });
        const newRefreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role, name: user.name });
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
const forgotPassword = async (req, res) => {
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
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.forgotPassword = forgotPassword;
// POST /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        if (!password || password.length < 6) {
            res.status(400).json({ message: 'Password must be at least 6 characters' });
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
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.resetPassword = resetPassword;
// GET /api/auth/me
const getMe = async (req, res) => {
    try {
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
                                primaryColor: true
                            }
                        }
                    },
                },
            },
        });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getMe = getMe;
//# sourceMappingURL=auth.controller.js.map