import prisma from '../config/db';

export const logActivity = async (
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  description?: string
) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        description,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
