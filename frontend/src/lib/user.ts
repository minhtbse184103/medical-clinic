import type { Role } from '../types/api';

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Quản trị viên',
  DOCTOR: 'Bác sĩ',
  RECEPTIONIST: 'Lễ tân',
  PATIENT: 'Bệnh nhân',
};

export const ROLE_COLOR: Record<Role, string> = {
  ADMIN: 'purple',
  DOCTOR: 'blue',
  RECEPTIONIST: 'orange',
  PATIENT: 'green',
};

/**
 * Two letters for the avatar. Takes the last two words of a Vietnamese name, where the
 * given name comes last, and falls back to the start of an email address.
 */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
