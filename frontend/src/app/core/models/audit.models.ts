export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  UPLOAD = 'UPLOAD',
  DOWNLOAD = 'DOWNLOAD',
  DELETE = 'DELETE',
  ACCESS_DENIED = 'ACCESS_DENIED',
}

export type AuditTone = 'neutral' | 'success' | 'info' | 'warning' | 'danger';

export const AUDIT_ACTIONS: Record<
  AuditAction,
  { label: string; icon: string; tone: AuditTone }
> = {
  [AuditAction.LOGIN]: { label: 'Inicio de sesión', icon: 'login', tone: 'neutral' },
  [AuditAction.LOGIN_FAILED]: { label: 'Inicio fallido', icon: 'gpp_maybe', tone: 'warning' },
  [AuditAction.LOGOUT]: { label: 'Cierre de sesión', icon: 'logout', tone: 'neutral' },
  [AuditAction.UPLOAD]: { label: 'Carga', icon: 'upload', tone: 'success' },
  [AuditAction.DOWNLOAD]: { label: 'Descarga', icon: 'download', tone: 'info' },
  [AuditAction.DELETE]: { label: 'Eliminación', icon: 'delete_outline', tone: 'danger' },
  [AuditAction.ACCESS_DENIED]: { label: 'Acceso denegado', icon: 'block', tone: 'danger' },
};

export interface AuditActor {
  id: string;
  fullName: string;
  email: string;
}

export interface AuditLog {
  id: string;
  action: AuditAction;
  actor: AuditActor | null;
  fileId: string | null;
  fileName: string | null;
  ipAddress: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogPage {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditQuery {
  page: number;
  limit: number;
  action: AuditAction | null;
}
