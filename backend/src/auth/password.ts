import { compare, hash } from 'bcrypt';

/** Costo de bcrypt: ~250 ms por hash, suficiente para frenar ataques de fuerza bruta. */
export const BCRYPT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(
  plain: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(plain, passwordHash);
}
