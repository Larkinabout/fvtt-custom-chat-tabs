import { MODULE, SETTING } from "./constants.mjs";

/* ---------------------------------------- */
/*  Logging                                 */
/* ---------------------------------------- */

/** Console logger. */
export class Logger {
  /**
   * Log an info message.
   * @param {string} message Message
   * @param {boolean} [notify=false] Whether to show a UI notification
   */
  static info(message, notify = false) {
    if ( notify ) ui.notifications.info(`${MODULE.NAME} | ${message}`);
    else console.log(`${MODULE.NAME} Info | ${message}`);
  }

  /**
   * Log a warning message.
   * @param {string} message Message
   * @param {boolean} [notify=false] Whether to show a UI notification
   */
  static warn(message, notify = false) {
    if ( notify ) ui.notifications.warn(`${MODULE.NAME} | ${message}`);
    else console.warn(`${MODULE.NAME} Warn | ${message}`);
  }

  /**
   * Log an error message.
   * @param {string} message Message
   * @param {boolean} [notify=false] Whether to show a UI notification
   */
  static error(message, notify = false) {
    if ( notify ) ui.notifications.error(`${MODULE.NAME} | ${message}`);
    else console.error(`${MODULE.NAME} Error | ${message}`);
  }

  /**
   * Log a debug message. Only outputs when the debug setting is enabled.
   * @param {string} message Message
   * @param {*} [data] Optional data
   */
  static debug(message, data) {
    try {
      if ( !game.settings?.get(MODULE.ID, SETTING.DEBUG.KEY) ) return;
    } catch {
      return;
    }
    if ( data === undefined ) {
      console.log(`${MODULE.NAME} Debug | ${message}`);
      return;
    }
    const dataClone = foundry.utils.deepClone(data);
    console.log(`${MODULE.NAME} Debug | ${message}`, dataClone);
  }
}

/* ---------------------------------------- */
/*  Settings                                */
/* ---------------------------------------- */

/**
 * Get a module setting value.
 * @param {string} key The setting key
 * @returns {*} The setting value
 */
export function getSetting(key) {
  return game.settings.get(MODULE.ID, key);
}

/**
 * Set a module setting value.
 * @param {string} key  The setting key
 * @param {*} value The setting value
 * @returns {Promise}
 */
export function setSetting(key, value) {
  return game.settings.set(MODULE.ID, key, value);
}
