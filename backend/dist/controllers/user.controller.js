"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updatePassword = exports.updateUserStatus = exports.updateUserRole = exports.updateUser = exports.createUser = exports.getUserById = exports.getActiveUsers = exports.getUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../config/db"));
const activity_service_1 = require("../services/activity.service");
const pagination_1 = require("../utils/pagination");
const roles_1 = require("../config/roles");
const AVATAR_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];
// GET /api/users — admin/super_admin only
const getUsers = async (req, res) => {
    try {
        const role = req.query.role;
        const status = req.query.status;
        const search = req.query.search;
        const where = { deletedAt: null };
        if (role)
            where.role = role;
        if (status)
            where.status = status;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        const paginationParams = (0, pagination_1.parsePagination)(req.query);
        const [users, total] = await Promise.all([
            db_1.default.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true,
                    avatarColor: true,
                    designation: true,
                    isActive: true,
                    departmentId: true,
                    skills: true,
                    joiningDate: true,
                    emergencyContact: true,
                    phoneNumber: true,
                    reportingManagerId: true,
                    bio: true,
                    dateOfBirth: true,
                    gender: true,
                    bloodGroup: true,
                    address: true,
                    githubUrl: true,
                    twitterUrl: true,
                    linkedinUrl: true,
                    portfolioUrl: true,
                    employeeId: true,
                    employmentType: true,
                    workLocation: true,
                    bankName: true,
                    accountNumber: true,
                    ifscCode: true,
                    panNumber: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                skip: paginationParams.skip,
                take: paginationParams.take,
            }),
            db_1.default.user.count({ where }),
        ]);
        res.json({
            ...(0, pagination_1.paginatedResponse)(users, total, paginationParams),
            // Keep 'users' root key for backwards compatibility with existing frontend
            users
        });
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getUsers = getUsers;
// GET /api/users/active — authenticated users only
const getActiveUsers = async (req, res) => {
    try {
        const users = await db_1.default.user.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                email: true,
                avatarColor: true,
                designation: true,
                departmentId: true,
            },
            orderBy: { name: 'asc' },
        });
        res.json({ users });
    }
    catch (error) {
        console.error('Get active users error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getActiveUsers = getActiveUsers;
// GET /api/users/:id
const getUserById = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await db_1.default.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                avatarColor: true,
                designation: true,
                isActive: true,
                skills: true,
                joiningDate: true,
                emergencyContact: true,
                phoneNumber: true,
                bio: true,
                dateOfBirth: true,
                gender: true,
                bloodGroup: true,
                address: true,
                githubUrl: true,
                twitterUrl: true,
                linkedinUrl: true,
                portfolioUrl: true,
                employeeId: true,
                employmentType: true,
                workLocation: true,
                bankName: true,
                accountNumber: true,
                ifscCode: true,
                panNumber: true,
                departmentId: true,
                department: {
                    select: { id: true, name: true, color: true }
                },
                reportingManagerId: true,
                reportingManager: {
                    select: { id: true, name: true, email: true }
                },
                _count: {
                    select: {
                        assignedTasks: true,
                        ownedProjects: true,
                    }
                },
                createdAt: true,
            },
        });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getUserById = getUserById;
// POST /api/users — admin/super_admin only (create user directly)
const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ message: 'Name, email, and password are required' });
            return;
        }
        const existing = await db_1.default.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ message: 'Email already in use' });
            return;
        }
        // Only admins or managers can create other users (usually HR)
        // Check if requester has sufficient rank to assign the target role
        if (roles_1.RoleRank[req.user.role] < roles_1.RoleRank[roles_1.Role.MANAGER]) {
            res.status(403).json({ message: 'Insufficient permission to create users' });
            return;
        }
        if (roles_1.RoleRank[req.user.role] <= roles_1.RoleRank[role] && req.user.role !== roles_1.Role.ADMIN) {
            res.status(403).json({ message: 'You cannot create a user with a higher or equal role to yourself' });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
        const user = await db_1.default.user.create({
            data: {
                name,
                email,
                passwordHash,
                role: Object.values(roles_1.Role).includes(role) ? role : roles_1.Role.EMPLOYEE,
                status: 'ACTIVE', // Admin-created users are auto-active
                // Only Admin or HR can set designation during creation
                designation: ((0, roles_1.isAdmin)(req.user.role) || (0, roles_1.isHR)(req.user.role)) ? (req.body.designation || null) : null,
                avatarColor,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                avatarColor: true,
                designation: true,
                isActive: true,
                createdAt: true,
            },
        });
        await (0, activity_service_1.logActivity)(req.user.id, 'CREATED_USER', 'employee', user.id, `Created user ${user.name}`);
        res.status(201).json({ user });
    }
    catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createUser = createUser;
// PUT /api/users/:id
const updateUser = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, email, designation, skills, joiningDate, emergencyContact, reportingManagerId, phoneNumber, bio, dateOfBirth, gender, bloodGroup, address, githubUrl, twitterUrl, linkedinUrl, portfolioUrl, employeeId, employmentType, workLocation, bankName, accountNumber, ifscCode, panNumber } = req.body;
        // Employees can only update themselves. Admin/HR/Managers can update others.
        const isSelf = req.user.id === id;
        const requesterRole = req.user.role;
        const canEditPrivileged = (0, roles_1.isAdmin)(requesterRole) || (0, roles_1.isHR)(requesterRole);
        if (!(0, roles_1.isStaff)(requesterRole) && !isSelf) {
            res.status(403).json({ message: 'Not allowed to update other users' });
            return;
        }
        const dataToUpdate = { name, email };
        // Role update: ONLY Admin
        if (req.body.role !== undefined && (0, roles_1.isAdmin)(requesterRole)) {
            dataToUpdate.role = req.body.role;
        }
        // Designation update: Admin or HR
        if (designation !== undefined && ((0, roles_1.isAdmin)(requesterRole) || (0, roles_1.isHR)(requesterRole))) {
            dataToUpdate.designation = designation;
        }
        // Other fields: Admin, HR or Manager (if allowed) or Self
        if (skills !== undefined)
            dataToUpdate.skills = skills;
        if (joiningDate !== undefined)
            dataToUpdate.joiningDate = joiningDate ? new Date(joiningDate) : null;
        if (emergencyContact !== undefined)
            dataToUpdate.emergencyContact = emergencyContact;
        if (reportingManagerId !== undefined)
            dataToUpdate.reportingManagerId = reportingManagerId || null;
        // New Fields
        if (phoneNumber !== undefined)
            dataToUpdate.phoneNumber = phoneNumber;
        if (bio !== undefined)
            dataToUpdate.bio = bio;
        if (dateOfBirth !== undefined)
            dataToUpdate.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
        if (gender !== undefined)
            dataToUpdate.gender = gender;
        if (bloodGroup !== undefined)
            dataToUpdate.bloodGroup = bloodGroup;
        if (address !== undefined)
            dataToUpdate.address = address;
        if (githubUrl !== undefined)
            dataToUpdate.githubUrl = githubUrl;
        if (twitterUrl !== undefined)
            dataToUpdate.twitterUrl = twitterUrl;
        if (linkedinUrl !== undefined)
            dataToUpdate.linkedinUrl = linkedinUrl;
        if (portfolioUrl !== undefined)
            dataToUpdate.portfolioUrl = portfolioUrl;
        // Privileged fields (Admin/HR only or restricted logic)
        if (canEditPrivileged) {
            if (employeeId !== undefined)
                dataToUpdate.employeeId = employeeId;
            if (employmentType !== undefined)
                dataToUpdate.employmentType = employmentType;
            if (workLocation !== undefined)
                dataToUpdate.workLocation = workLocation;
            if (bankName !== undefined)
                dataToUpdate.bankName = bankName;
            if (accountNumber !== undefined)
                dataToUpdate.accountNumber = accountNumber;
            if (ifscCode !== undefined)
                dataToUpdate.ifscCode = ifscCode;
            if (panNumber !== undefined)
                dataToUpdate.panNumber = panNumber;
        }
        const user = await db_1.default.user.update({
            where: { id },
            data: dataToUpdate,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                avatarColor: true,
                designation: true,
                isActive: true,
                skills: true,
                joiningDate: true,
                emergencyContact: true,
                phoneNumber: true,
                bio: true,
                dateOfBirth: true,
                gender: true,
                bloodGroup: true,
                address: true,
                githubUrl: true,
                twitterUrl: true,
                linkedinUrl: true,
                portfolioUrl: true,
                employeeId: true,
                employmentType: true,
                workLocation: true,
                bankName: true,
                accountNumber: true,
                ifscCode: true,
                panNumber: true,
                reportingManagerId: true,
                createdAt: true,
            },
        });
        res.json({ user });
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateUser = updateUser;
// PATCH /api/users/:id/role — super_admin only for admin promotion, admin/super_admin for user role
const updateUserRole = async (req, res) => {
    try {
        const id = req.params.id;
        const { role } = req.body;
        // Only admins or those with higher rank can change roles.
        // Cannot promote someone to a rank equal/higher than your own (unless admin).
        if (req.user.role !== roles_1.Role.ADMIN) {
            if (roles_1.RoleRank[req.user.role] < roles_1.RoleRank[roles_1.Role.MANAGER]) {
                res.status(403).json({ message: 'Only Managers and Admins can update roles' });
                return;
            }
            if (roles_1.RoleRank[role] >= roles_1.RoleRank[req.user.role]) {
                res.status(403).json({ message: 'You cannot promote a user to a rank equal or higher than your own' });
                return;
            }
        }
        const user = await db_1.default.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                avatarColor: true,
                isActive: true,
            },
        });
        await (0, activity_service_1.logActivity)(req.user.id, 'CHANGED_ROLE', 'employee', user.id, `Changed ${user.name}'s role to ${role}`);
        res.json({ user });
    }
    catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateUserRole = updateUserRole;
// PATCH /api/users/:id/status — admin/super_admin only
const updateUserStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { isActive } = req.body;
        if (req.user.id === id) {
            res.status(400).json({ message: 'Cannot deactivate your own account' });
            return;
        }
        const user = await db_1.default.user.update({
            where: { id },
            data: {
                isActive,
                status: isActive ? 'ACTIVE' : 'INACTIVE',
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                avatarColor: true,
                isActive: true,
            },
        });
        await (0, activity_service_1.logActivity)(req.user.id, isActive ? 'ACTIVATED_USER' : 'DEACTIVATED_USER', 'employee', user.id, `${isActive ? 'Activated' : 'Deactivated'} user ${user.name}`);
        res.json({ user });
    }
    catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateUserStatus = updateUserStatus;
// PATCH /api/users/:id/password
const updatePassword = async (req, res) => {
    try {
        const id = req.params.id;
        const { currentPassword, newPassword } = req.body;
        if (req.user.id !== id) {
            res.status(403).json({ message: 'Not allowed to change another user\'s password' });
            return;
        }
        const user = await db_1.default.user.findUnique({ where: { id } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({ message: 'Current password is incorrect' });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 12);
        await db_1.default.user.update({
            where: { id },
            data: { passwordHash },
        });
        res.json({ message: 'Password updated successfully' });
    }
    catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updatePassword = updatePassword;
// DELETE /api/users/:id — super_admin only
const deleteUser = async (req, res) => {
    const id = req.params.id;
    console.log('>>> [DEBUG] Entering deleteUser for ID:', id);
    try {
        if (req.user.id === id) {
            res.status(400).json({ message: 'Cannot delete your own account' });
            return;
        }
        if (req.user.role !== roles_1.Role.ADMIN) {
            res.status(403).json({ message: 'Only Admin can delete users' });
            return;
        }
        const user = await db_1.default.user.findUnique({ where: { id } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Implement soft deletion by setting isDeleted and deletedAt
        await db_1.default.user.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false }
        });
        // Log success
        await (0, activity_service_1.logActivity)(req.user.id, 'DELETED_USER', 'employee', id, `Soft deleted user ${user.name}`);
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('>>> [DEBUG] Delete error caught:', error.code, error.message);
        res.status(500).json({
            message: 'Database error occurred while deleting user.'
        });
        // Fallback for other errors (still returning 400 to avoid "Internal Server Error" generic messages)
        res.status(400).json({
            message: error?.message || 'Database error occurred while deleting user. They may have active associations.'
        });
    }
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=user.controller.js.map