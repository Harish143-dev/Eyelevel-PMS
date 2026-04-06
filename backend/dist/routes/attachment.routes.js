"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// import { getAttachments, uploadAttachment, downloadAttachment, deleteAttachment } from '../controllers/attachment.controller';
const auth_middleware_1 = require("../middleware/auth.middleware");
// import { upload } from '../middleware/upload.middleware';
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyJWT);
// DEPRECATED: File uploading is disabled to preserve server storage.
const disabledHandler = (_req, res) => {
    res.status(403).json({ message: 'File uploads and attachments are disabled by system policy.' });
};
router.get('/tasks/:id/attachments', (req, res) => res.json({ attachments: [] }));
router.post('/tasks/:id/attachments', disabledHandler);
router.get('/attachments/:id/download', disabledHandler);
router.delete('/attachments/:id', disabledHandler);
exports.default = router;
//# sourceMappingURL=attachment.routes.js.map