import * as braze from '@braze/web-sdk';
import { getPersistedExternalId } from '../logic/userSession.js';
import { AppLogger } from './AppLogger.js';

export const EVENT_LOGGED = 'EVENT_LOGGED';

/**
 * Singleton-style Braze wrapper: init, user, logging, and pub/sub for overlays.
 */
class BrazeManagerClass {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this.listeners = new Map();
    this._initialized = false;
  }

  /**
   * @param {string} method
   * @param {Record<string, unknown>} [data]
   * @param {'[SDK]'|'[AUTH]'} [category]
   * @returns {void}
   */
  logSdkSuccess(method, data = {}, category = '[SDK]') {
    AppLogger.info(category, `Braze SDK call succeeded: ${method}`, data);
  }

  /**
   * @param {string} externalId
   * @returns {string}
   */
  maskExternalId(externalId) {
    if (!externalId) return '';
    const id = String(externalId);
    if (id.length <= 3) return `${id[0] ?? ''}***`;
    return `${id.slice(0, 3)}***`;
  }

  /**
   * @param {string} eventType
   * @param {Function} callback
   * @returns {() => void}
   */
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);
    return () => {
      const set = this.listeners.get(eventType);
      if (set) set.delete(callback);
    };
  }

  /**
   * @param {string} eventType
   * @param {unknown} payload
   * @returns {void}
   */
  notify(eventType, payload) {
    const set = this.listeners.get(eventType);
    if (!set) return;
    set.forEach((cb) => {
      try {
        cb(payload);
      } catch (e) {
        AppLogger.warn('[SDK]', 'BrazeManager listener error', e);
      }
    });
  }

  /**
   * @param {string} apiKey
   * @param {string} baseUrl
   * @returns {boolean}
   */
  initialize(apiKey, baseUrl) {
    if (!apiKey || !baseUrl) {
      AppLogger.warn('[SDK]', 'Braze init skipped — missing API key or endpoint');
      return false;
    }
    try {
      const ok = braze.initialize(apiKey, {
        baseUrl,
        enableLogging: true,
        allowUserSuppliedJavascript: true,
        noCookies: false,
      });
      this._initialized = ok;
      if (ok) {
        this.logSdkSuccess('initialize', { baseUrl });
        braze.automaticallyShowInAppMessages();
        this.logSdkSuccess('automaticallyShowInAppMessages');
        AppLogger.info('[SDK]', 'Braze Web SDK initialized', { baseUrl });
      } else {
        AppLogger.warn('[SDK]', 'Braze initialize returned false', { baseUrl });
      }
      return ok;
    } catch (e) {
      this._initialized = false;
      AppLogger.warn('[SDK]', 'Braze initialize failed', e);
      return false;
    }
  }

  /**
   * @param {string} externalId
   * @param {{ firstName?: string, lastName?: string, email?: string }} [profile]
   * @returns {void}
   */
  login(externalId, profile = {}) {
    try {
      if (typeof braze.changeUser === 'function') {
        braze.changeUser(externalId);
        this.logSdkSuccess('changeUser', { externalIdPreview: this.maskExternalId(externalId) }, '[AUTH]');
      }
      braze.openSession();
      this.logSdkSuccess('openSession', { externalIdPreview: this.maskExternalId(externalId) }, '[AUTH]');

      const user = braze.getUser?.();
      if (user) {
        if (profile.email && typeof user.setEmail === 'function') {
          user.setEmail(profile.email.trim().toLowerCase());
          this.logSdkSuccess('setEmail');
        }
        if (profile.firstName && typeof user.setFirstName === 'function') {
          user.setFirstName(profile.firstName.trim());
          this.logSdkSuccess('setFirstName');
        }
        if (profile.lastName && typeof user.setLastName === 'function') {
          user.setLastName(profile.lastName.trim());
          this.logSdkSuccess('setLastName');
        }
      }
      AppLogger.info('[AUTH]', 'Braze login / session opened', {
        externalIdPreview: this.maskExternalId(externalId),
      });
    } catch (e) {
      AppLogger.warn('[AUTH]', 'Braze login failed', e);
    }
  }

  /** @returns {void} */
  syncUserFromStorage() {
    if (!this._initialized) return;
    const id = getPersistedExternalId();
    if (id) {
      this.login(id);
      return;
    }
    try {
      braze.openSession();
      this.logSdkSuccess('openSession', { anonymous: true }, '[AUTH]');
      AppLogger.info('[AUTH]', 'Braze anonymous session opened');
    } catch (e) {
      AppLogger.warn('[AUTH]', 'Braze anonymous openSession failed', e);
    }
  }

  /**
   * @param {string} name
   * @param {Record<string, unknown>} [props]
   * @returns {void}
   */
  logCustomEvent(name, props) {
    try {
      if (typeof braze.logCustomEvent === 'function') {
        braze.logCustomEvent(name, props);
        this.logSdkSuccess('logCustomEvent', { name });
      }
    } catch (e) {
      AppLogger.warn('[SDK]', 'logCustomEvent failed', e);
    }
    this.notify(EVENT_LOGGED, { name, props: props || {}, at: Date.now() });
  }

  /**
   * Set one or more Braze custom user attributes (anonymous or identified).
   * @param {Record<string, string | number | boolean | string[] | null>} attrs
   * @returns {void}
   */
  setCustomAttributes(attrs) {
    /** @type {Record<string, unknown>} */
    const applied = {};
    try {
      const user = braze.getUser?.();
      if (!user || typeof user.setCustomUserAttribute !== 'function') {
        AppLogger.warn('[SDK]', 'setCustomUserAttribute unavailable');
        this.notify(EVENT_LOGGED, {
          name: 'setCustomUserAttribute',
          props: { error: 'unavailable', ...attrs },
          at: Date.now(),
        });
        return;
      }
      for (const [key, value] of Object.entries(attrs || {})) {
        if (!key) continue;
        user.setCustomUserAttribute(key, value);
        applied[key] = value;
        this.logSdkSuccess('setCustomUserAttribute', { key });
      }
      AppLogger.info('[SDK]', 'Braze custom attributes updated', applied);
    } catch (e) {
      AppLogger.warn('[SDK]', 'setCustomUserAttribute failed', e);
    }
    this.notify(EVENT_LOGGED, {
      name: 'setCustomUserAttribute',
      props: Object.keys(applied).length ? applied : attrs || {},
      at: Date.now(),
    });
  }

  /** @returns {void} */
  requestImmediateDataFlush() {
    try {
      if (typeof braze.requestImmediateDataFlush === 'function') {
        braze.requestImmediateDataFlush();
        this.logSdkSuccess('requestImmediateDataFlush');
      }
    } catch (e) {
      AppLogger.warn('[SDK]', 'requestImmediateDataFlush failed', e);
    }
  }

  /** @returns {boolean} */
  get isInitialized() {
    return this._initialized;
  }
}

export const BrazeManager = new BrazeManagerClass();
