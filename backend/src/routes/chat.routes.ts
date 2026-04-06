import { Router } from 'express';
import {
  getChannels,
  createChannel,
  getMessages,
  postMessage,
  updateMessage,
  deleteMessage
} from '../controllers/chat.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { checkFeature } from '../middleware/feature.middleware';

const router = Router();

router.use(verifyJWT);
router.use(checkFeature('teamChat'));

router.get('/channels', getChannels);
router.post('/channels', createChannel);

router.get('/channels/:channelId/messages', getMessages);
router.post('/channels/:channelId/messages', postMessage);
router.patch('/channels/:channelId/messages/:messageId', updateMessage);
router.delete('/channels/:channelId/messages/:messageId', deleteMessage);

export default router;
