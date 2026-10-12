import { extname } from 'node:path';

//Este es el catálogo de extensiones seguras
export const FILE_TYPE_CATALOG: Readonly<Record<string, string>> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  csv: 'text/csv',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  zip: 'application/zip',
};

export function getExtension(fileName: string): string {
  return extname(fileName).slice(1).toLowerCase();
}

//Función para sanitizar (Como quitar emojis, rutas, caracteres especiales, entre otros)
export function sanitizeFileName(rawName: string): string {
  const decoded = Buffer.from(rawName, 'latin1').toString('utf8');
  const name = decoded.includes('�') ? rawName : decoded;

  const baseName = name.split(/[\\/]/).pop() ?? '';

  const withoutControlChars = [...baseName]
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code > 0x1f && code !== 0x7f;
    })
    .join('')
    .trim();

  return withoutControlChars.slice(-255) || 'archivo';
}
