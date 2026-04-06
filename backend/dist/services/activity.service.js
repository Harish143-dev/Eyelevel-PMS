"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = void 0;
const db_1 = __importDefault(require("../config/db"));
const logActivity = async (userId, action, entityType, entityId, description, ipAddress) => {
    try {
        await db_1.default.activityLog.create({
            data: {
                userId,
                action,
                entityType,
                entityId,
                description,
                ipAddress,
            },
        });
    }
    catch (error) {
        console.error('Failed to log activity:', error);
    }
};
exports.logActivity = logActivity;
//# sourceMappingURL=activity.service.js.map