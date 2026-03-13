import { Router } from 'express';
import { getComments, createComment, updateComment, deleteComment } from '../controllers/comment.controller';
import { verifyJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(verifyJWT);

router.get('/tasks/:id/comments', getComments);
router.post('/tasks/:id/comments', createComment);
router.put('/comments/:id', updateComment);
router.delete('/comments/:id', deleteComment);

export default router;
