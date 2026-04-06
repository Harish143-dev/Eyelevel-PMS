"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const attendance_controller_1 = require("../controllers/attendance.controller");
const router = express_1.default.Router();
// All attendance routes require authentication
router.use(auth_middleware_1.verifyJWT);
router.post('/check-in', attendance_controller_1.checkIn);
router.post('/check-out', attendance_controller_1.checkOut);
router.get('/status', attendance_controller_1.getTodayStatus);
router.get('/logs', attendance_controller_1.getAttendanceLogs);
exports.default = router;
//# sourceMappingURL=attendance.routes.js.map