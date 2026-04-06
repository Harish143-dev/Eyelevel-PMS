"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDocument = exports.updateDocument = exports.createDocument = exports.getDocumentById = exports.getProjectDocuments = void 0;
const db_1 = __importDefault(require("../config/db"));
const activity_service_1 = require("../services/activity.service");
const getProjectDocuments = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const documents = await db_1.default.document.findMany({
            where: { projectId },
            orderBy: { updatedAt: 'desc' },
            include: {
                creator: { select: { id: true, name: true, avatarColor: true } }
            }
        });
        res.json({ documents });
    }
    catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getProjectDocuments = getProjectDocuments;
const getDocumentById = async (req, res) => {
    try {
        const id = req.params.id;
        const document = await db_1.default.document.findUnique({
            where: { id },
            include: {
                creator: { select: { id: true, name: true, avatarColor: true } }
            }
        });
        if (!document) {
            res.status(404).json({ message: 'Document not found' });
            return;
        }
        res.json({ document });
    }
    catch (error) {
        console.error('Get document error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getDocumentById = getDocumentById;
const createDocument = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const { title, content } = req.body;
        if (!title) {
            res.status(400).json({ message: 'Title is required' });
            return;
        }
        const project = await db_1.default.project.findUnique({ where: { id: projectId } });
        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        const document = await db_1.default.document.create({
            data: {
                title,
                content: content || '',
                projectId,
                createdBy: req.user.id,
            },
            include: {
                creator: { select: { id: true, name: true, avatarColor: true } }
            }
        });
        await (0, activity_service_1.logActivity)(req.user.id, 'CREATED_DOCUMENT', 'project', projectId, `Created document "${title}"`);
        res.status(201).json({ document });
    }
    catch (error) {
        console.error('Create document error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createDocument = createDocument;
const updateDocument = async (req, res) => {
    try {
        const id = req.params.id;
        const { title, content } = req.body;
        const existingDoc = await db_1.default.document.findUnique({ where: { id } });
        if (!existingDoc) {
            res.status(404).json({ message: 'Document not found' });
            return;
        }
        const document = await db_1.default.document.update({
            where: { id },
            data: {
                title: title || existingDoc.title,
                content: content !== undefined ? content : existingDoc.content,
            },
            include: {
                creator: { select: { id: true, name: true, avatarColor: true } }
            }
        });
        await (0, activity_service_1.logActivity)(req.user.id, 'UPDATED_DOCUMENT', 'project', document.projectId, `Updated document "${document.title}"`);
        res.json({ document });
    }
    catch (error) {
        console.error('Update document error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateDocument = updateDocument;
const deleteDocument = async (req, res) => {
    try {
        const id = req.params.id;
        const existingDoc = await db_1.default.document.findUnique({ where: { id } });
        if (!existingDoc) {
            res.status(404).json({ message: 'Document not found' });
            return;
        }
        await db_1.default.document.delete({ where: { id } });
        await (0, activity_service_1.logActivity)(req.user.id, 'DELETED_DOCUMENT', 'project', existingDoc.projectId, `Deleted document "${existingDoc.title}"`);
        res.json({ message: 'Document deleted successfully' });
    }
    catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteDocument = deleteDocument;
//# sourceMappingURL=document.controller.js.map