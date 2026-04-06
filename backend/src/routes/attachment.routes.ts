import { Router, Response } from 'express';
// import { getAttachments, uploadAttachment, downloadAttachment, deleteAttachment } from '../controllers/attachment.controller';
import { verifyJWT } from '../middleware/auth.middleware';
// import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(verifyJWT);

// DEPRECATED: File uploading is disabled to preserve server storage.
const disabledHandler = (_req: any, res: Response) => {
  res.status(403).json({ message: 'File uploads and attachments are disabled by system policy.' });
};

router.get('/tasks/:id/attachments', (req, res) => res.json({ attachments: [] }));
router.post('/tasks/:id/attachments', disabledHandler);
router.get('/attachments/:id/download', disabledHandler);
router.delete('/attachments/:id', disabledHandler);

export default router;
