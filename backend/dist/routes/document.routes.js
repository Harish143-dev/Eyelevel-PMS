"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const document_controller_1 = require("../controllers/document.controller");
const router = (0, express_1.Router)({ mergeParams: true }); // Important: to access :projectId if using nested routes
// In app.ts, we will mount this at /api/projects/:projectId/documents
// But we might also want a direct route /api/documents/:id for updates/deletes
// We'll export two routers or just handle both
// Let's assume this router is mounted at /api/documents and we handle everything here.
// Actually, it's better to mount at /api/projects/:projectId/documents for listing/creating
// And /api/documents/:id for get/update/delete
router.use(auth_middleware_1.verifyJWT);
router.get('/projects/:projectId/documents', document_controller_1.getProjectDocuments);
router.post('/projects/:projectId/documents', document_controller_1.createDocument);
router.get('/documents/:id', document_controller_1.getDocumentById);
router.put('/documents/:id', document_controller_1.updateDocument);
router.delete('/documents/:id', document_controller_1.deleteDocument);
exports.default = router;
//# sourceMappingURL=document.routes.js.map