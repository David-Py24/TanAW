/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AuthSession {
  email: string;
  guest?: boolean;
  signedInAt: string;
}

const SESSION_KEY = 'accessmap_session_v1';

function parseSession(raw: string | null): AuthSession | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed || typeof parsed.signedInAt !== 'string') return null;
    if (!parsed.guest && typeof parsed.email !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Restores a remembered session from localStorage first, then a tab-scoped
 * session from sessionStorage.
 */
export function loadSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const remembered = parseSession(window.localStorage.getItem(SESSION_KEY));
    if (remembered) return remembered;

    return parseSession(window.sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

/**
 * Stores the session in localStorage when "Remember me" is enabled, otherwise
 * in sessionStorage so it ends when the tab closes.
 */
export function saveSession(session: AuthSession, remember: boolean): void {
  if (typeof window === 'undefined') return;

  const raw = JSON.stringify(session);

  try {
    if (remember) {
      window.localStorage.setItem(SESSION_KEY, raw);
      window.sessionStorage.removeItem(SESSION_KEY);
    } else {
      window.sessionStorage.setItem(SESSION_KEY, raw);
      window.localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // Storage can be unavailable in private mode; the in-memory session still works.
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function getDisplayName(session: AuthSession): string {
  if (session.guest) return 'Guest Explorer';

  const localPart = (session.email.split('@')[0] || '').trim();
  const words = localPart
    .replace(/[._-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1));

  return words.join(' ') || 'AccessMap Member';
}

export function getInitials(session: AuthSession): string {
  const parts = getDisplayName(session).split(/\s+/).filter(Boolean);

  if (parts.length === 0) return 'AM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}
