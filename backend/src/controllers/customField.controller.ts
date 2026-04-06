import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/custom-fields?module=task
export const getCustomFields = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const { module } = req.query;

    const where: any = { companyId };
    if (module) where.module = module;

    const fields = await (prisma as any).customFieldDefinition.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
    });

    res.json({ fields });
  } catch (error) {
    console.error('Get custom fields error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/custom-fields
export const createCustomField = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const { module, fieldName, fieldType, options, isRequired, showInList } = req.body;

    if (!module || !fieldName || !fieldType) {
      res.status(400).json({ message: 'Module, field name, and field type are required' });
      return;
    }

    const maxOrder = await (prisma as any).customFieldDefinition.aggregate({
      where: { companyId, module },
      _max: { orderIndex: true },
    });
    
    const nextOrder = (maxOrder._max.orderIndex || 0) + 1;

    const field = await (prisma as any).customFieldDefinition.create({
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
  } catch (error) {
    console.error('Create custom field error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/custom-fields/:id
export const updateCustomField = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { fieldName, fieldType, options, isRequired, showInList } = req.body;

    const field = await (prisma as any).customFieldDefinition.findFirst({
      where: { id, companyId },
    });

    if (!field) {
      res.status(404).json({ message: 'Custom field not found' });
      return;
    }

    const updatedField = await (prisma as any).customFieldDefinition.update({
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
  } catch (error) {
    console.error('Update custom field error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/custom-fields/:id
export const deleteCustomField = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const field = await (prisma as any).customFieldDefinition.findFirst({
      where: { id, companyId },
    });

    if (!field) {
      res.status(404).json({ message: 'Custom field not found' });
      return;
    }

    await (prisma as any).customFieldDefinition.delete({ where: { id } });

    res.json({ message: 'Custom field deleted successfully' });
  } catch (error) {
    console.error('Delete custom field error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/custom-fields/values/:entityId
export const getCustomFieldValues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const { entityId } = req.params;

    const values = await (prisma as any).customFieldValue.findMany({
      where: { entityId, companyId },
      include: { fieldDef: true }
    });

    res.json({ values });
  } catch (error) {
    console.error('Get custom field values error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/custom-fields/values
export const upsertCustomFieldValues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const { entityId, values } = req.body; // values: [{ fieldDefId: 'uuid', valueText: '...', ... }]

    if (!entityId || !Array.isArray(values)) {
      res.status(400).json({ message: 'entityId and array of values are required' });
      return;
    }

    const savedValues: any[] = [];

    // Use transaction for bulk upsert
    await prisma.$transaction(async (tx) => {
      for (const val of values) {
        if (!val.fieldDefId) continue;
        
        // Ensure field exists and belongs to company
        const fieldDef = await (tx as any).customFieldDefinition.findFirst({
          where: { id: val.fieldDefId, companyId }
        });
        if (!fieldDef) continue;

        const data: any = {
          companyId,
          entityId,
          fieldDefId: val.fieldDefId,
        };

        if (val.valueText !== undefined) data.valueText = val.valueText;
        if (val.valueNumber !== undefined) data.valueNumber = val.valueNumber !== null ? Number(val.valueNumber) : null;
        if (val.valueDate !== undefined) data.valueDate = val.valueDate ? new Date(val.valueDate) : null;
        if (val.valueBoolean !== undefined) data.valueBoolean = val.valueBoolean;

        // Check if value exists
        const existing = await (tx as any).customFieldValue.findFirst({
          where: { entityId, fieldDefId: val.fieldDefId }
        });

        let saved;
        if (existing) {
          saved = await (tx as any).customFieldValue.update({
            where: { id: existing.id },
            data
          });
        } else {
          saved = await (tx as any).customFieldValue.create({ data });
        }
        savedValues.push(saved);
      }
    });

    res.json({ message: 'Custom field values updated', savedValues });
  } catch (error) {
    console.error('Upsert custom field values error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
