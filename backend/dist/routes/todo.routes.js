"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const todo_controller_1 = require("../controllers/todo.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyJWT);
router.get('/', todo_controller_1.getTodos);
router.post('/', todo_controller_1.createTodo);
router.patch('/:id', todo_controller_1.updateTodo);
router.delete('/:id', todo_controller_1.deleteTodo);
exports.default = router;
//# sourceMappingURL=todo.routes.js.map