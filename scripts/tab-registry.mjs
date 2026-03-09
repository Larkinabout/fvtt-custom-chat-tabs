import { MODULE, SETTING, TAB } from "./constants.mjs";
import { getSetting } from "./utils.mjs";

/**
 * Build a filter function from a preset configuration.
 * @param {string} preset Preset type
 * @param {object} config Preset configuration
 * @returns {Function} Filter function (message) => boolean
 */
export function buildFilter(preset, config = {}) {
  switch ( preset ) {
    case "speaker":
      return msg => msg.author?.id === config.userId;
    case "type":
      return msg => config.types.includes(msg.style);
    case "whisper":
      return msg => msg.whisper?.length > 0;
    case "roll":
      return msg => msg.isRoll;
    case "flag":
      return msg => {
        const flags = msg.flags?.[config.flagModule];
        if ( !flags ) return false;
        if ( config.flagKey ) return flags[config.flagKey] === config.flagValue;
        return true;
      };
    case "content":
      return msg => new RegExp(config.pattern).test(msg.content);
    default:
      return () => true;
  }
}

/* ---------------------------------------- */

/**
 * Get the built-in tabs.
 * @returns {object[]} Array of built-in tab configs
 */
export function getBuiltInTabs() {
  return [
    {
      key: TAB.ALL,
      label: game.i18n.localize("CUSTOM_CHAT_TABS.tabs.all"),
      filter: null,
      removable: false
    },
    {
      key: TAB.PINNED,
      label: game.i18n.localize("CUSTOM_CHAT_TABS.tabs.pinned"),
      icon: "fas fa-thumbtack",
      filter: message => message.flags?.[MODULE.ID]?.pinned === true,
      removable: false
    }
  ];
}

/* ---------------------------------------- */

/**
 * Get optional tabs.
 * @returns {object[]} Array of optional tab configs
 */
export function getOptionalTabs() {
  const tabs = [];

  if ( getSetting(SETTING.TAB_IC.KEY) ) {
    tabs.push({
      key: TAB.IC,
      label: game.i18n.localize("CUSTOM_CHAT_TABS.tabs.ic"),
      filter: msg => msg.style === CONST.CHAT_MESSAGE_STYLES.IC,
      removable: false
    });
  }

  if ( getSetting(SETTING.TAB_OOC.KEY) ) {
    tabs.push({
      key: TAB.OOC,
      label: game.i18n.localize("CUSTOM_CHAT_TABS.tabs.ooc"),
      filter: msg => msg.style === CONST.CHAT_MESSAGE_STYLES.OOC,
      removable: false
    });
  }

  if ( getSetting(SETTING.TAB_ROLLS.KEY) ) {
    tabs.push({
      key: TAB.ROLLS,
      label: game.i18n.localize("CUSTOM_CHAT_TABS.tabs.rolls"),
      filter: msg => msg.isRoll,
      removable: false
    });
  }

  if ( getSetting(SETTING.TAB_WHISPERS.KEY) ) {
    tabs.push({
      key: TAB.WHISPERS,
      label: game.i18n.localize("CUSTOM_CHAT_TABS.tabs.whispers"),
      filter: msg => msg.whisper?.length > 0,
      removable: false
    });
  }

  return tabs;
}

/* ---------------------------------------- */

/**
 * Get user-configured tabs.
 * @returns {object[]} Array of user tab configs
 */
export function getUserTabs() {
  const tabsConfig = getSetting(SETTING.TABS.KEY);
  const tabs = [];

  for ( const [key, data] of Object.entries(tabsConfig) ) {
    tabs.push({
      key,
      label: data.label,
      filter: buildFilter(data.preset, data.config),
      removable: true,
      order: data.order ?? 0
    });
  }

  tabs.sort((a, b) => a.order - b.order);
  return tabs;
}
