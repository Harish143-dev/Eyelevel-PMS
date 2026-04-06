"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const verifyJWT = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: 'Access token required' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET);
        const user = await db_1.default.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true, name: true, isActive: true, status: true, companyId: true },
        });
        if (!user || !user.isActive || user.status !== 'ACTIVE') {
            res.status(401).json({ message: 'User not found or deactivated' });
            return;
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            companyId: user.companyId || undefined,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ message: 'Token expired' });
            return;
        }
        res.status(401).json({ message: 'Invalid token' });
    }
};
exports.verifyJWT = verifyJWT;
//# sourceMappingURL=auth.middleware.js.map