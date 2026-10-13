import { AreaRef, RoleCode } from './auth.models';

export interface RoleOption {
  id: number;
  code: RoleCode;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface AdminArea {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  role: { id: number; code: RoleCode; name: string };
  area: AreaRef | null;
  managedAreas: AreaRef[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  fullName: string;
  password: string;
  roleCode: RoleCode;
  areaId: string | null;
  managedAreaIds: string[];
}

export type UpdateUserRequest = Partial<
  Omit<CreateUserRequest, 'email'> & { isActive: boolean }
>;

export interface CreateAreaRequest {
  name: string;
  description?: string;
}

export type UpdateAreaRequest = Partial<CreateAreaRequest & { isActive: boolean }>;

export const ROLES_REQUIRING_AREA: readonly RoleCode[] = [
  RoleCode.STANDARD,
  RoleCode.AREA_HEAD,
];
