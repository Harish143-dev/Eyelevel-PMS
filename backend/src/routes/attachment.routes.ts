import { Router } from 'express';
import { getAttachments, uploadAttachment, downloadAttachment, deleteAttachment } from '../controllers/attachment.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(verifyJWT);

router.get('/tasks/:id/attachments', getAttachments);
router.post('/tasks/:id/attachments', upload.single('file'), uploadAttachment);
router.get('/attachments/:id/download', downloadAttachment);
router.delete('/attachments/:id', deleteAttachment);

export default router;
