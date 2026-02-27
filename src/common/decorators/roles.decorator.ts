import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/database/entities/user.entity';

export const ROLES_KEY = 'roles';

/**
 * Restrict route access to specific roles. Use after JwtAuthGuard.
 * @example @Roles(UserRole.ADMIN) - only ADMIN
 * @example @Roles(UserRole.ADMIN, UserRole.HR) - ADMIN or HR
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
