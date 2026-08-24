import { StorageManager } from '../managers/StorageManager.js';

/**
 * @returns {string | null}
 */
export function getPersistedExternalId() {
  const uid = StorageManager.get('user_id', null);
  if (typeof uid === 'string' && uid.trim()) return uid.trim();
  const session = StorageManager.get('user_session', null);
  if (
    session &&
    typeof session === 'object' &&
    typeof /** @type {{ external_id?: string }} */ (session).external_id === 'string' &&
    /** @type {{ external_id: string }} */ (session).external_id.trim()
  ) {
    return /** @type {{ external_id: string }} */ (session).external_id.trim();
  }
  return null;
}

/**
 * @param {string} externalId
 * @param {'login' | 'registration'} source
 * @param {{ firstName?: string, lastName?: string, email?: string } } [profile]
 * @returns {void}
 */
export function persistAuthSession(externalId, source, profile = {}) {
  const id = externalId.trim();
  StorageManager.set('user_id', id);
  StorageManager.set('user_session', {
    external_id: id,
    logged_in_at: new Date().toISOString(),
    source,
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    email: profile.email || id,
  });
}

/**
 * @returns {{ external_id: string, firstName?: string, lastName?: string, email?: string } | null}
 */
export function getUserSession() {
  const session = StorageManager.get('user_session', null);
  if (session && typeof session === 'object' && /** @type {{ external_id?: string }} */ (session).external_id) {
    return /** @type {{ external_id: string, firstName?: string, lastName?: string, email?: string }} */ (session);
  }
  return null;
}
