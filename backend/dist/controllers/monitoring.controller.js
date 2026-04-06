"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptConsent = exports.getDailySummary = void 0;
const db_1 = __importDefault(require("../config/db"));
// GET /api/monitoring/daily
const getDailySummary = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(403).json({ message: 'No company attached to user' });
            return;
        }
        const targetDateStr = req.query.date;
        let targetDate = new Date();
        if (targetDateStr) {
            targetDate = new Date(targetDateStr);
        }
        targetDate.setUTCHours(0, 0, 0, 0);
        const summaries = await db_1.default.employeeMonitoring.findMany({
            where: { companyId, date: targetDate },
            include: {
                user: { select: { id: true, name: true, avatarColor: true, email: true, designation: true } },
            },
            orderBy: { firstLoginAt: 'asc' },
        });
        res.json(summaries);
    }
    catch (error) {
        console.error('getDailySummary error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getDailySummary = getDailySummary;
// POST /api/monitoring/consent
// Allows users to accept the monitoring policy notice.
const acceptConsent = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        await db_1.default.user.update({
            where: { id: req.user.id },
            data: { monitoringConsentShown: true },
        });
        res.json({ message: 'Consent acknowledged' });
    }
    catch (error) {
        console.error('acceptConsent error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.acceptConsent = acceptConsent;
//# sourceMappingURL=monitoring.controller.js.map