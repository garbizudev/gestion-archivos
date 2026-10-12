import { AreaRef } from './auth.models';

export interface FileOwner {
  id: string;
  fullName: string;
  email: string;
}

export interface FileItem {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  owner: FileOwner;
  area: AreaRef | null;
  canDelete: boolean;
}

export interface UploadRules {
  maxUploadBytes: number;
  allowedExtensions: string[];
}
