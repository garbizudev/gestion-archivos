export enum RoleCode {
  STANDARD = 'STANDARD',
  AREA_HEAD = 'AREA_HEAD',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

export interface AreaRef {
  id: string;
  name: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  roleCode: RoleCode;
  roleName: string;
  areaId: string | null;
  areaName: string | null;
  managedAreas: AreaRef[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  user: AuthUser;
}
