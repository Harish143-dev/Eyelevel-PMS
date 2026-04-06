import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware';
import {
  getProjectDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
} from '../controllers/document.controller';

const router = Router({ mergeParams: true }); // Important: to access :projectId if using nested routes

// In app.ts, we will mount this at /api/projects/:projectId/documents
// But we might also want a direct route /api/documents/:id for updates/deletes

// We'll export two routers or just handle both
// Let's assume this router is mounted at /api/documents and we handle everything here.
// Actually, it's better to mount at /api/projects/:projectId/documents for listing/creating
// And /api/documents/:id for get/update/delete

router.use(verifyJWT);

router.get('/projects/:projectId/documents', getProjectDocuments);
router.post('/projects/:projectId/documents', createDocument);

router.get('/documents/:id', getDocumentById);
router.put('/documents/:id', updateDocument);
router.delete('/documents/:id', deleteDocument);

export default router;
