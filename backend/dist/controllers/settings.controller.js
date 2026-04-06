"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCompanySettings = exports.getCompanySettings = void 0;
const db_1 = __importDefault(require("../config/db"));
const getCompanySettings = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(400).json({ error: 'No company attached' });
            return;
        }
        const settings = await db_1.default.companySettings.findUnique({
            where: { companyId }
        });
        const company = await db_1.default.company.findUnique({
            where: { id: companyId },
            select: { name: true, status: true, setupCompleted: true }
        });
        res.json({ company, settings });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};
exports.getCompanySettings = getCompanySettings;
const updateCompanySettings = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(400).json({ error: 'No company attached' });
            return;
        }
        const data = { ...req.body };
        // separate company fields
        if (data.companyName) {
            await db_1.default.company.update({
                where: { id: companyId },
                data: { name: data.companyName }
            });
            delete data.companyName;
        }
        const setObj = {};
        if (data.businessType !== undefined)
            setObj.businessType = data.businessType;
        if (data.address !== undefined)
            setObj.address = data.address;
        if (data.city !== undefined)
            setObj.city = data.city;
        if (data.state !== undefined)
            setObj.state = data.state;
        if (data.country !== undefined)
            setObj.country = data.country;
        if (data.website !== undefined)
            setObj.website = data.website;
        if (data.logoUrl !== undefined)
            setObj.logoUrl = data.logoUrl;
        if (data.timezone !== undefined)
            setObj.timezone = data.timezone;
        if (data.currency !== undefined)
            setObj.currency = data.currency;
        if (data.dateFormat !== undefined)
            setObj.dateFormat = data.dateFormat;
        if (data.timeFormat !== undefined)
            setObj.timeFormat = data.timeFormat;
        if (data.workDays !== undefined)
            setObj.workDays = data.workDays;
        if (data.workHoursStart !== undefined)
            setObj.workHoursStart = data.workHoursStart;
        if (data.workHoursEnd !== undefined)
            setObj.workHoursEnd = data.workHoursEnd;
        if (data.lateGraceMinutes !== undefined)
            setObj.lateGraceMinutes = Number(data.lateGraceMinutes);
        if (data.primaryColor !== undefined)
            setObj.primaryColor = data.primaryColor;
        if (data.emailFooterText !== undefined)
            setObj.emailFooterText = data.emailFooterText;
        if (data.notificationMatrix !== undefined)
            setObj.notificationMatrix = data.notificationMatrix;
        if (data.telegramBotToken !== undefined)
            setObj.telegramBotToken = data.telegramBotToken;
        if (data.telegramChatId !== undefined)
            setObj.telegramChatId = data.telegramChatId;
        // Security fields
        if (data.passwordPolicy !== undefined)
            setObj.passwordPolicy = data.passwordPolicy;
        if (data.sessionTimeout !== undefined)
            setObj.sessionTimeout = Number(data.sessionTimeout);
        if (data.require2fa !== undefined)
            setObj.require2fa = Boolean(data.require2fa);
        // HR fields
        if (data.halfDayThreshold !== undefined)
            setObj.halfDayThreshold = Number(data.halfDayThreshold);
        if (data.overtimeLimit !== undefined)
            setObj.overtimeLimit = Number(data.overtimeLimit);
        if (data.leaveCategories !== undefined)
            setObj.leaveCategories = data.leaveCategories;
        const settings = await db_1.default.companySettings.upsert({
            where: { companyId },
            create: { companyId, ...setObj },
            update: { ...setObj }
        });
        res.json({ message: 'Settings updated successfully', settings });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
};
exports.updateCompanySettings = updateCompanySettings;
//# sourceMappingURL=settings.controller.js.map