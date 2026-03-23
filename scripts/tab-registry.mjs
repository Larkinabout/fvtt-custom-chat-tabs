import { MODULE, TAB } from "./constants.mjs";

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
    case "pinned":
      return msg => msg.flags?.[MODULE.ID]?.pinned === true;
    case "scene":
      return msg => msg.speaker?.scene === canvas.scene?.id;
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
    }
  ];
}

/* ---------------------------------------- */

/**
 * Get the available preset tab definitions.
 * @returns {object[]} Array of preset tab definitions
 */
export function getPresetTabs() {
  return [
    {
      key: TAB.PINNED,
      label: game.i18n.localize("CUSTOM_CHAT_TABS.tabs.pinned"),
      icon: "fas fa-thumbtack",
      preset: "pinned",
      config: {}
    },
    {
      key: TAB.IC,
      label: game.i18n.localize("CUSTOM_CHAT_TABS.tabs.ic"),
      preset: "type",
      config: { types: [CONST.CHAT_MESSAGE_STYLES.IC] }
    },
    {
      key: TAB.OOC,
      label: game.i18n.localize("CUSTOM_CHAT_TABS.tabs.ooc"),
      preset: "type",
      config: { types: [CONST.CHAT_MESSAGE_STYLES.OOC] }
    },
    {
      key: TAB.ROLLS,
      label: game.i18n.localize("CUSTOM_CHAT_TABS.tabs.rolls"),
      preset: "roll",
      config: {}
    },
    {
      key: TAB.SCENE,
      label: game.i18n.localize("CUSTOM_CHAT_TABS.tabs.scene"),
      icon: "fas fa-map",
      preset: "scene",
      config: {}
    },
    {
      key: TAB.WHISPERS,
      label: game.i18n.localize("CUSTOM_CHAT_TABS.tabs.whispers"),
      preset: "whisper",
      config: {}
    }
  ];
}

/* ---------------------------------------- */

/**
 * Get filter function for a preset tab.
 * @param {object} tabData Tab data with preset and config
 * @returns {Function} Filter function (message) => boolean
 */
export function getFilterForTab(tabData) {
  if ( tabData.preset ) return buildFilter(tabData.preset, tabData.config);
  return () => true;
}
