import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { logActivity } from '../services/activity.service';
import { parsePagination, paginatedResponse } from '../utils/pagination';
import { validatePasswordWithSettings } from '../utils/security';
import { Role, RoleRank, isAdmin, isHR, isStaff } from '../config/roles';

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];

// Sensitive financial fields that should only be visible to Admin/HR or the user themselves
const SENSITIVE_FINANCIAL_FIELDS = ['bankName', 'accountNumber', 'ifscCode', 'panNumber'];

const stripSensitiveFields = (user: any, requesterId: string, requesterRole: string): any => {
  const canSeeSensitive = isAdmin(requesterRole) || isHR(requesterRole) || user.id === requesterId;
  if (canSeeSensitive) return user;
  const sanitized = { ...user };
  for (const field of SENSITIVE_FINANCIAL_FIELDS) {
    delete sanitized[field];
  }
  return sanitized;
};

// GET /api/users — admin/super_admin only
export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const role = req.query.role as string;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const where: any = { deletedAt: null };

    // TENANT ISOLATION: scope to user's company
    if (req.user!.companyId) {
      where.companyId = req.user!.companyId;
    }

    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const paginationParams = parsePagination(req.query);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
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
      prisma.user.count({ where }),
    ]);

    // Strip sensitive financial PII based on requester role
    const sanitizedUsers = users.map(u => stripSensitiveFields(u, req.user!.id, req.user!.role));

    res.json({
      ...paginatedResponse(sanitizedUsers, total, paginationParams),
      // Keep 'users' root key for backwards compatibility with existing frontend
      users: sanitizedUsers
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/active — authenticated users only
export const getActiveUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { 
        isActive: true,
        ...(req.user?.companyId ? { companyId: req.user.companyId } : {})
      },
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
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id
export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({
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
        companyId: true,
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

    // TENANT ISOLATION: verify user belongs to same company
    if (req.user!.companyId && user.companyId && user.companyId !== req.user!.companyId) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Strip sensitive financial PII based on requester role
    const sanitizedUser = stripSensitiveFields(user, req.user!.id, req.user!.role);

    res.json({ user: sanitizedUser });
  } catch (error) {
    next(error);
  }
};

// POST /api/users — admin/super_admin only (create user directly)
export const createUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and password are required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      res.status(409).json({ message: 'Email already exists' });
      return;
    }

    // Only admins or managers can create other users (usually HR)
    // Check if requester has sufficient rank to assign the target role
    if (RoleRank[req.user!.role] < RoleRank[Role.MANAGER]) {
      res.status(403).json({ message: 'Insufficient permission to create users' });
      return;
    }

    // Enforce password policy
    const policyCheck = await validatePasswordWithSettings(password, req.user!.companyId || null);
    if (!policyCheck.valid) {
      res.status(400).json({ message: policyCheck.message });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const userRole = Object.values(Role).includes(role) ? role : Role.EMPLOYEE;

    // FIND MATCHING ROLE ID for the company
    let roleId = null;
    if (req.user!.companyId) {
      const match = await prisma.role.findFirst({
        where: { 
          companyId: req.user!.companyId, 
          name: { equals: userRole, mode: 'insensitive' } 
        }
      });
      if (match) roleId = match.id;
    }

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        role: userRole,
        roleId,
        status: 'ACTIVE', // Admin-created users are auto-active
        companyId: req.user!.companyId || null, // TENANT ISOLATION: inherit creator's company
        // Only Admin or HR can set designation during creation
        designation: (isAdmin(req.user!.role) || isHR(req.user!.role)) ? (req.body.designation || null) : null,
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

    await logActivity(req.user!.id, 'CREATED_USER', 'employee', user.id, `Created user ${user.name}`);

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id
export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { 
      name, email, designation, skills, joiningDate, emergencyContact, reportingManagerId,
      phoneNumber, bio, dateOfBirth, gender, bloodGroup, address,
      githubUrl, twitterUrl, linkedinUrl, portfolioUrl,
      employeeId, employmentType, workLocation,
      bankName, accountNumber, ifscCode, panNumber
    } = req.body;

    // Employees can only update themselves. Admin/HR/Managers can update others.
    const isSelf = req.user!.id === id;
    const requesterRole = req.user!.role;
    const canEditPrivileged = isAdmin(requesterRole) || isHR(requesterRole);

    if (!isStaff(requesterRole) && !isSelf) {
      res.status(403).json({ message: 'Not allowed to update other users' });
      return;
    }

    const dataToUpdate: any = { name };

    // Validate email uniqueness and require password for self-email change
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { id } });
      if (!existingUser) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      // If email is being changed, we require current password verification for self-edits (protection)
      if (email !== existingUser.email && isSelf) {
        const { currentPassword } = req.body;
        if (!currentPassword) {
          res.status(401).json({ message: 'Current password is required to change email' });
          return;
        }

        const isValid = await bcrypt.compare(currentPassword, existingUser.passwordHash);
        if (!isValid) {
          res.status(401).json({ message: 'Invalid current password' });
          return;
        }
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existingWithEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existingWithEmail && existingWithEmail.id !== id) {
        res.status(409).json({ message: 'Email already exists' });
        return;
      }
      dataToUpdate.email = normalizedEmail;
    }
    
    // Role update: ONLY Admin — with explicit RoleRank guard to prevent escalation
    if (req.body.role !== undefined) {
      if (!isAdmin(requesterRole)) {
        res.status(403).json({ message: 'Only admins can change user roles' });
        return;
      }

      const roleEnum = req.body.role;
      dataToUpdate.role = roleEnum;
      
      const roleRecord = await prisma.role.findFirst({
        where: { 
          OR: [
            { companyId: req.user!.companyId },
            { isSystemRole: true, companyId: null }
          ],
          name: { equals: roleEnum, mode: 'insensitive' } 
        }
      });
      if (roleRecord) dataToUpdate.roleId = roleRecord.id;
    }

    // Designation update: Admin or HR
    if (designation !== undefined && (isAdmin(requesterRole) || isHR(requesterRole))) {
      dataToUpdate.designation = designation;
    }

    // Other fields: Admin, HR or Manager (if allowed) or Self
    if (skills !== undefined) dataToUpdate.skills = skills;
    if (joiningDate !== undefined) dataToUpdate.joiningDate = joiningDate ? new Date(joiningDate) : null;
    if (emergencyContact !== undefined) dataToUpdate.emergencyContact = emergencyContact;
    if (reportingManagerId !== undefined) dataToUpdate.reportingManagerId = reportingManagerId || null;
    
    // New Fields
    if (phoneNumber !== undefined) dataToUpdate.phoneNumber = phoneNumber;
    if (bio !== undefined) dataToUpdate.bio = bio;
    if (dateOfBirth !== undefined) dataToUpdate.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (gender !== undefined) dataToUpdate.gender = gender;
    if (bloodGroup !== undefined) dataToUpdate.bloodGroup = bloodGroup;
    if (address !== undefined) dataToUpdate.address = address;
    if (githubUrl !== undefined) dataToUpdate.githubUrl = githubUrl;
    if (twitterUrl !== undefined) dataToUpdate.twitterUrl = twitterUrl;
    if (linkedinUrl !== undefined) dataToUpdate.linkedinUrl = linkedinUrl;
    if (portfolioUrl !== undefined) dataToUpdate.portfolioUrl = portfolioUrl;
    
    // Privileged fields (Admin/HR only or restricted logic)
    if (canEditPrivileged) {
      if (employeeId !== undefined) dataToUpdate.employeeId = employeeId;
      if (employmentType !== undefined) dataToUpdate.employmentType = employmentType;
      if (workLocation !== undefined) dataToUpdate.workLocation = workLocation;
      if (bankName !== undefined) dataToUpdate.bankName = bankName;
      if (accountNumber !== undefined) dataToUpdate.accountNumber = accountNumber;
      if (ifscCode !== undefined) dataToUpdate.ifscCode = ifscCode;
      if (panNumber !== undefined) dataToUpdate.panNumber = panNumber;
    }

    const user = await prisma.user.update({
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

    // Strip sensitive financial PII based on requester role
    const sanitizedUser = stripSensitiveFields(user, req.user!.id, req.user!.role);
    res.json({ user: sanitizedUser });
  } catch (error: any) {
    // Catch Prisma unique constraint errors gracefully
    if (error?.code === 'P2002') {
      res.status(409).json({ message: 'A unique constraint was violated. The value is already in use.' });
      return;
    }
    next(error);
  }
};

// PATCH /api/users/:id/role — super_admin only for admin promotion, admin/super_admin for user role
export const updateUserRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { role } = req.body;

    // --- Fix 4: Strict enum guard — reject any value not in the known role set ---
    // This prevents undefined/arbitrary strings from bypassing RoleRank comparisons.
    const VALID_ROLES = Object.values(Role) as string[];
    if (!role || !VALID_ROLES.includes(role)) {
      res.status(400).json({ message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
      return;
    }
    // --- End enum guard ---

    // Only admins or those with higher rank can change roles.
    // Cannot promote someone to a rank equal/higher than your own (unless admin).
    if (req.user!.role !== Role.ADMIN) {
        if (RoleRank[req.user!.role] < RoleRank[Role.MANAGER]) {
            res.status(403).json({ message: 'Only Managers and Admins can update roles' });
            return;
        }
        if (RoleRank[role] >= RoleRank[req.user!.role]) {
            res.status(403).json({ message: 'You cannot promote a user to a rank equal or higher than your own' });
            return;
        }
    }

    const user = await prisma.user.update({
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

    await logActivity(req.user!.id, 'CHANGED_ROLE', 'employee', user.id, `Changed ${user.name}'s role to ${role}`);

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id/status — admin/super_admin only
export const updateUserStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { isActive } = req.body;

    if (req.user!.id === id) {
      res.status(400).json({ message: 'Cannot deactivate your own account' });
      return;
    }

    const user = await prisma.user.update({
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

    await logActivity(
      req.user!.id,
      isActive ? 'ACTIVATED_USER' : 'DEACTIVATED_USER',
      'employee',
      user.id,
      `${isActive ? 'Activated' : 'Deactivated'} user ${user.name}`
    );

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id/password
export const updatePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { currentPassword, newPassword } = req.body;

    if (req.user!.id !== id) {
      res.status(403).json({ message: 'Not allowed to change another user\'s password' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: 'Current password is incorrect' });
      return;
    }

    // Security Hardening: Prevent reusing the current password
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      res.status(400).json({ message: 'New password must be different from your current password' });
      return;
    }

    // Enforce password policy
    const policyCheck = await validatePasswordWithSettings(newPassword, req.user!.companyId || null);
    if (!policyCheck.valid) {
      res.status(400).json({ message: policyCheck.message });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id — admin only
export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;

  try {
    if (req.user!.id === id) {
      res.status(400).json({ message: 'Cannot delete your own account' });
      return;
    }

    if (req.user!.role !== Role.ADMIN) {
      res.status(403).json({ message: 'Only Admin can delete users' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Soft deletion: preserve audit trail by keeping record with deletedAt timestamp
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false }
    });

    await logActivity(req.user!.id, 'DELETED_USER', 'employee', id, `Soft deleted user ${user.name}`);

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    // Fix 5: Removed unreachable fallback — res.headersSent is always true after the 500 below.
    next(error);
  }
};

// GET /api/users/preferences
export const getPreferences = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { preferences: true },
    });
    res.json(user?.preferences || { theme: 'system', language: 'en', defaultDashboardView: 'overview', itemsPerPage: 25 });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/preferences
export const updatePreferences = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { theme, language, defaultDashboardView, itemsPerPage } = req.body;
    
    // Get existing preferences to merge
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { preferences: true },
    });

    const existingPrefs = (user?.preferences as any) || {};
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        preferences: {
          ...existingPrefs,
          ...(theme && { theme }),
          ...(language && { language }),
          ...(defaultDashboardView && { defaultDashboardView }),
          ...(itemsPerPage && { itemsPerPage })
        }
      },
      select: { preferences: true },
    });
    
    res.json(updatedUser.preferences);
  } catch (error) {
    next(error);
  }
};
