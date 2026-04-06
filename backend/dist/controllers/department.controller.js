"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignUsersToDepartment = exports.deleteDepartment = exports.updateDepartment = exports.getDepartmentById = exports.getDepartments = exports.createDepartment = void 0;
const db_1 = __importDefault(require("../config/db"));
const createDepartment = async (req, res) => {
    try {
        const { name, description, color, userIds, managerId } = req.body;
        const newDept = await db_1.default.department.create({
            data: { name, description, color, managerId: managerId || null }
        });
        const allUserIds = [...(userIds || [])];
        if (managerId && !allUserIds.includes(managerId)) {
            allUserIds.push(managerId);
        }
        if (allUserIds.length > 0) {
            await db_1.default.user.updateMany({
                where: { id: { in: allUserIds } },
                data: { departmentId: newDept.id }
            });
        }
        const department = await db_1.default.department.findUnique({
            where: { id: newDept.id },
            include: {
                manager: { select: { id: true, name: true, avatarColor: true } },
                _count: { select: { users: true, projects: true } }
            }
        });
        res.status(201).json({ message: 'Department created successfully', department });
    }
    catch (error) {
        res.status(500).json({ message: error?.message || 'Failed to create department', error });
    }
};
exports.createDepartment = createDepartment;
const getDepartments = async (req, res) => {
    try {
        const departments = await db_1.default.department.findMany({
            include: {
                manager: { select: { id: true, name: true, avatarColor: true } },
                _count: { select: { users: true, projects: true } }
            }
        });
        res.json({ departments });
    }
    catch (error) {
        res.status(500).json({ message: error?.message || 'Failed to retrieve departments', error });
    }
};
exports.getDepartments = getDepartments;
const getDepartmentById = async (req, res) => {
    try {
        const id = req.params.id;
        const department = await db_1.default.department.findUnique({
            where: { id },
            include: {
                manager: { select: { id: true, name: true, avatarColor: true } },
                users: {
                    select: { id: true, name: true, email: true, avatarColor: true, designation: true }
                },
                projects: {
                    select: { id: true, name: true, status: true, category: true }
                }
            }
        });
        if (!department) {
            res.status(404).json({ message: 'Department not found' });
            return;
        }
        res.json({ department });
    }
    catch (error) {
        res.status(500).json({ message: error?.message || 'Failed to retrieve department', error });
    }
};
exports.getDepartmentById = getDepartmentById;
const updateDepartment = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, description, color, userIds, managerId } = req.body;
        await db_1.default.department.update({
            where: { id },
            data: { name, description, color, managerId: managerId || null }
        });
        // If manager is assigned, ensure they are in the department
        if (managerId) {
            await db_1.default.user.update({
                where: { id: managerId },
                data: { departmentId: id }
            });
        }
        if (userIds) {
            // First, remove everyone from this department
            await db_1.default.user.updateMany({
                where: { departmentId: id },
                data: { departmentId: null }
            });
            // Then add the new ones
            if (userIds.length > 0) {
                await db_1.default.user.updateMany({
                    where: { id: { in: userIds } },
                    data: { departmentId: id }
                });
            }
        }
        const department = await db_1.default.department.findUnique({
            where: { id },
            include: {
                manager: { select: { id: true, name: true, avatarColor: true } },
                _count: { select: { users: true, projects: true } }
            }
        });
        res.json({ message: 'Department updated successfully', department });
    }
    catch (error) {
        res.status(500).json({ message: error?.message || 'Failed to update department', error });
    }
};
exports.updateDepartment = updateDepartment;
const deleteDepartment = async (req, res) => {
    try {
        const id = req.params.id;
        // Manually decouple users and projects to avoid strict Foreign Key constraint crashes
        await db_1.default.user.updateMany({ where: { departmentId: id }, data: { departmentId: null } });
        await db_1.default.project.updateMany({ where: { departmentId: id }, data: { departmentId: null } });
        await db_1.default.department.delete({ where: { id } });
        res.json({ message: 'Department deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error?.message || 'Failed to delete department', error });
    }
};
exports.deleteDepartment = deleteDepartment;
const assignUsersToDepartment = async (req, res) => {
    try {
        const id = req.params.id;
        const { userIds } = req.body; // Array of user IDs
        await db_1.default.user.updateMany({
            where: { id: { in: userIds } },
            data: { departmentId: id }
        });
        res.json({ message: 'Users assigned to department successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error?.message || 'Failed to assign users', error });
    }
};
exports.assignUsersToDepartment = assignUsersToDepartment;
//# sourceMappingURL=department.controller.js.map