/**
 * Server-side singleton for DocumentManager.
 * Used by API routes to share state across requests.
 */

import { DocumentManager } from './documents';
import { PACKAGE_DIR } from './types';

let instance: DocumentManager | null = null;

export function getManager(): DocumentManager {
  if (!instance) {
    instance = new DocumentManager(PACKAGE_DIR);
  }
  return instance;
}

export function resetManager(): void {
  instance = null;
}

/**
 * Validate the edit token from the Authorization header.
 */
export function validateEditToken(authHeader: string | null): boolean {
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const expected = process.env.EDIT_TOKEN || 'newswright-partner-2026';
  return token === expected;
}
