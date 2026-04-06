"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const permissions_1 = require("../config/permissions");
const customField_controller_1 = require("../controllers/customField.controller");
const router = (0, express_1.Router)();
// Apply auth middleware to all routes
router.use(auth_middleware_1.verifyJWT);
// Definitions CRUD (Admins only / COMPANY_SETTINGS permission)
router.get('/', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.COMPANY_SETTINGS), customField_controller_1.getCustomFields);
router.post('/', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.COMPANY_SETTINGS), customField_controller_1.createCustomField);
router.put('/:id', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.COMPANY_SETTINGS), customField_controller_1.updateCustomField);
router.delete('/:id', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.COMPANY_SETTINGS), customField_controller_1.deleteCustomField);
// Values (accessible to anyone with read/write access to the respective entities)
// For MVP, we will allow all authenticated users in the company to view and edit custom field values.
router.get('/values/:entityId', customField_controller_1.getCustomFieldValues);
router.post('/values', customField_controller_1.upsertCustomFieldValues);
exports.default = router;
//# sourceMappingURL=customField.routes.js.map