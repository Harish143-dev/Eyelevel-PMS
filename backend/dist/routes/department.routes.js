"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const department_controller_1 = require("../controllers/department.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const permissions_1 = require("../config/permissions");
const feature_middleware_1 = require("../middleware/feature.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.verifyJWT);
router.use((0, feature_middleware_1.checkFeature)('hrManagement'));
router.get('/', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.DEPARTMENT_VIEW), department_controller_1.getDepartments);
router.get('/:id', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.DEPARTMENT_VIEW), department_controller_1.getDepartmentById);
// Admin only routes
router.use(role_middleware_1.requireAdmin);
router.post('/', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.DEPARTMENT_CREATE), department_controller_1.createDepartment);
router.put('/:id', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.DEPARTMENT_EDIT), department_controller_1.updateDepartment);
router.delete('/:id', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.DEPARTMENT_DELETE), department_controller_1.deleteDepartment);
router.post('/:id/users', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.DEPARTMENT_EDIT), department_controller_1.assignUsersToDepartment);
exports.default = router;
//# sourceMappingURL=department.routes.js.map