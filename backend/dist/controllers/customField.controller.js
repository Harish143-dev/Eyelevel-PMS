"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertCustomFieldValues = exports.getCustomFieldValues = exports.deleteCustomField = exports.updateCustomField = exports.createCustomField = exports.getCustomFields = void 0;
const db_1 = __importDefault(require("../config/db"));
// GET /api/custom-fields?module=task
const getCustomFields = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { module } = req.query;
        const where = { companyId };
        if (module)
            where.module = module;
        const fields = await db_1.default.customFieldDefinition.findMany({
            where,
            orderBy: { orderIndex: 'asc' },
        });
        res.json({ fields });
    }
    catch (error) {
        console.error('Get custom fields error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getCustomFields = getCustomFields;
// POST /api/custom-fields
const createCustomField = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { module, fieldName, fieldType, options, isRequired, showInList } = req.body;
        if (!module || !fieldName || !fieldType) {
            res.status(400).json({ message: 'Module, field name, and field type are required' });
            return;
        }
        const maxOrder = await db_1.default.customFieldDefinition.aggregate({
            where: { companyId, module },
            _max: { orderIndex: true },
        });
        const nextOrder = (maxOrder._max.orderIndex || 0) + 1;
        const field = await db_1.default.customFieldDefinition.create({
            data: {
                companyId,
                module,
                fieldName,
                fieldType,
                options: options || null,
                isRequired: isRequired || false,
                showInList: showInList || false,
                orderIndex: nextOrder,
            },
        });
        res.status(201).json({ field });
    }
    catch (error) {
        console.error('Create custom field error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createCustomField = createCustomField;
// PUT /api/custom-fields/:id
const updateCustomField = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        const { fieldName, fieldType, options, isRequired, showInList } = req.body;
        const field = await db_1.default.customFieldDefinition.findFirst({
            where: { id, companyId },
        });
        if (!field) {
            res.status(404).json({ message: 'Custom field not found' });
            return;
        }
        const updatedField = await db_1.default.customFieldDefinition.update({
            where: { id },
            data: {
                fieldName,
                fieldType,
                options,
                isRequired,
                showInList,
            },
        });
        res.json({ field: updatedField });
    }
    catch (error) {
        console.error('Update custom field error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateCustomField = updateCustomField;
// DELETE /api/custom-fields/:id
const deleteCustomField = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        const field = await db_1.default.customFieldDefinition.findFirst({
            where: { id, companyId },
        });
        if (!field) {
            res.status(404).json({ message: 'Custom field not found' });
            return;
        }
        await db_1.default.customFieldDefinition.delete({ where: { id } });
        res.json({ message: 'Custom field deleted successfully' });
    }
    catch (error) {
        console.error('Delete custom field error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteCustomField = deleteCustomField;
// GET /api/custom-fields/values/:entityId
const getCustomFieldValues = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { entityId } = req.params;
        const values = await db_1.default.customFieldValue.findMany({
            where: { entityId, companyId },
            include: { fieldDef: true }
        });
        res.json({ values });
    }
    catch (error) {
        console.error('Get custom field values error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getCustomFieldValues = getCustomFieldValues;
// POST /api/custom-fields/values
const upsertCustomFieldValues = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { entityId, values } = req.body; // values: [{ fieldDefId: 'uuid', valueText: '...', ... }]
        if (!entityId || !Array.isArray(values)) {
            res.status(400).json({ message: 'entityId and array of values are required' });
            return;
        }
        const savedValues = [];
        // Use transaction for bulk upsert
        await db_1.default.$transaction(async (tx) => {
            for (const val of values) {
                if (!val.fieldDefId)
                    continue;
                // Ensure field exists and belongs to company
                const fieldDef = await tx.customFieldDefinition.findFirst({
                    where: { id: val.fieldDefId, companyId }
                });
                if (!fieldDef)
                    continue;
                const data = {
                    companyId,
                    entityId,
                    fieldDefId: val.fieldDefId,
                };
                if (val.valueText !== undefined)
                    data.valueText = val.valueText;
                if (val.valueNumber !== undefined)
                    data.valueNumber = val.valueNumber !== null ? Number(val.valueNumber) : null;
                if (val.valueDate !== undefined)
                    data.valueDate = val.valueDate ? new Date(val.valueDate) : null;
                if (val.valueBoolean !== undefined)
                    data.valueBoolean = val.valueBoolean;
                // Check if value exists
                const existing = await tx.customFieldValue.findFirst({
                    where: { entityId, fieldDefId: val.fieldDefId }
                });
                let saved;
                if (existing) {
                    saved = await tx.customFieldValue.update({
                        where: { id: existing.id },
                        data
                    });
                }
                else {
                    saved = await tx.customFieldValue.create({ data });
                }
                savedValues.push(saved);
            }
        });
        res.json({ message: 'Custom field values updated', savedValues });
    }
    catch (error) {
        console.error('Upsert custom field values error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.upsertCustomFieldValues = upsertCustomFieldValues;
//# sourceMappingURL=customField.controller.js.map