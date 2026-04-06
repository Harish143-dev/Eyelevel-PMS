"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const comment_controller_1 = require("../controllers/comment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyJWT);
router.get('/tasks/:id/comments', comment_controller_1.getComments);
router.post('/tasks/:id/comments', comment_controller_1.createComment);
router.put('/comments/:id', comment_controller_1.updateComment);
router.delete('/comments/:id', comment_controller_1.deleteComment);
exports.default = router;
//# sourceMappingURL=comment.routes.js.map