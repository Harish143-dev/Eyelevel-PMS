"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("../controllers/chat.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const feature_middleware_1 = require("../middleware/feature.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyJWT);
router.use((0, feature_middleware_1.checkFeature)('teamChat'));
router.get('/channels', chat_controller_1.getChannels);
router.post('/channels', chat_controller_1.createChannel);
router.get('/channels/:channelId/messages', chat_controller_1.getMessages);
router.post('/channels/:channelId/messages', chat_controller_1.postMessage);
router.patch('/channels/:channelId/messages/:messageId', chat_controller_1.updateMessage);
router.delete('/channels/:channelId/messages/:messageId', chat_controller_1.deleteMessage);
exports.default = router;
//# sourceMappingURL=chat.routes.js.map