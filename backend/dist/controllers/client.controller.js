"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteClient = exports.updateClient = exports.createClient = exports.getClientById = exports.getClients = void 0;
const db_1 = __importDefault(require("../config/db"));
const activity_service_1 = require("../services/activity.service");
// GET /api/clients
const getClients = async (req, res) => {
    try {
        const clients = await db_1.default.client.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { projects: true }
                }
            }
        });
        res.json({ clients });
    }
    catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getClients = getClients;
// GET /api/clients/:id
const getClientById = async (req, res) => {
    try {
        const { id } = req.params;
        const client = await db_1.default.client.findUnique({
            where: { id: id },
            include: {
                projects: {
                    select: { id: true, name: true, status: true }
                }
            }
        });
        if (!client) {
            res.status(404).json({ message: 'Client not found' });
            return;
        }
        res.json({ client });
    }
    catch (error) {
        console.error('Get client by id error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getClientById = getClientById;
// POST /api/clients
const createClient = async (req, res) => {
    try {
        const { name, email, phone, company: companyName, address } = req.body;
        if (!name) {
            res.status(400).json({ message: 'Client name is required' });
            return;
        }
        const client = await db_1.default.client.create({
            data: { name, email, phone, companyName, address }
        });
        await (0, activity_service_1.logActivity)(req.user.id, 'CLIENT_CREATED', 'client', client.id, `Created client ${name}`);
        res.status(201).json({ client });
    }
    catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createClient = createClient;
// PUT /api/clients/:id
const updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const clientParams = id;
        const { name, email, phone, company: companyName, address, status } = req.body;
        const existing = await db_1.default.client.findUnique({ where: { id: clientParams } });
        if (!existing) {
            res.status(404).json({ message: 'Client not found' });
            return;
        }
        const client = await db_1.default.client.update({
            where: { id: clientParams },
            data: { name, email, phone, companyName, address, status }
        });
        await (0, activity_service_1.logActivity)(req.user.id, 'CLIENT_UPDATED', 'client', client.id, `Updated client ${client.name}`);
        res.json({ client });
    }
    catch (error) {
        console.error('Update client error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateClient = updateClient;
// DELETE /api/clients/:id
const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;
        const clientId = id;
        const existing = await db_1.default.client.findUnique({
            where: { id: clientId },
            include: { _count: { select: { projects: true } } }
        });
        if (!existing) {
            res.status(404).json({ message: 'Client not found' });
            return;
        }
        if (existing._count?.projects > 0) {
            res.status(400).json({ message: 'Cannot delete client with active projects' });
            return;
        }
        await db_1.default.client.delete({ where: { id: clientId } });
        await (0, activity_service_1.logActivity)(req.user.id, 'CLIENT_DELETED', 'client', clientId, `Deleted client ${existing.name}`);
        res.json({ message: 'Client deleted successfully' });
    }
    catch (error) {
        console.error('Delete client error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteClient = deleteClient;
//# sourceMappingURL=client.controller.js.map