"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireStaff = exports.requireHR = exports.requireAdmin = exports.requireManager = exports.requireRole = void 0;
const roles_1 = require("../config/roles");
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ message: 'Forbidden: insufficient permissions' });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
// Convenience helpers using centralized Roles
exports.requireManager = (0, exports.requireRole)(roles_1.Role.ADMIN, roles_1.Role.MANAGER);
exports.requireAdmin = (0, exports.requireRole)(roles_1.Role.ADMIN);
exports.requireHR = (0, exports.requireRole)(roles_1.Role.ADMIN, roles_1.Role.HR);
exports.requireStaff = (0, exports.requireRole)(roles_1.Role.ADMIN, roles_1.Role.MANAGER, roles_1.Role.HR);
//# sourceMappingURL=role.middleware.js.map