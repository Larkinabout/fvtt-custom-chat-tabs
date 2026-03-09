import { MODULE, SETTING } from "./constants.mjs";

/**
 * Register module settings.
 */
export function registerSettings() {
  game.settings.register(MODULE.ID, SETTING.ENABLE.KEY, {
    name: "CUSTOM_CHAT_TABS.enable.name",
    hint: "CUSTOM_CHAT_TABS.enable.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    requiresReload: true
  });

  game.settings.register(MODULE.ID, SETTING.TABS.KEY, {
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  game.settings.register(MODULE.ID, SETTING.SHOW_PIN_BUTTON.KEY, {
    name: "CUSTOM_CHAT_TABS.showPinButton.name",
    hint: "CUSTOM_CHAT_TABS.showPinButton.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE.ID, SETTING.NOTIFICATION_PIPS.KEY, {
    name: "CUSTOM_CHAT_TABS.notificationPips.name",
    hint: "CUSTOM_CHAT_TABS.notificationPips.hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE.ID, SETTING.TAB_IC.KEY, {
    name: "CUSTOM_CHAT_TABS.tabIC.name",
    hint: "CUSTOM_CHAT_TABS.tabIC.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    requiresReload: true
  });

  game.settings.register(MODULE.ID, SETTING.TAB_OOC.KEY, {
    name: "CUSTOM_CHAT_TABS.tabOOC.name",
    hint: "CUSTOM_CHAT_TABS.tabOOC.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    requiresReload: true
  });

  game.settings.register(MODULE.ID, SETTING.TAB_ROLLS.KEY, {
    name: "CUSTOM_CHAT_TABS.tabRolls.name",
    hint: "CUSTOM_CHAT_TABS.tabRolls.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    requiresReload: true
  });

  game.settings.register(MODULE.ID, SETTING.TAB_WHISPERS.KEY, {
    name: "CUSTOM_CHAT_TABS.tabWhispers.name",
    hint: "CUSTOM_CHAT_TABS.tabWhispers.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    requiresReload: true
  });

  game.settings.register(MODULE.ID, SETTING.DEBUG.KEY, {
    name: "CUSTOM_CHAT_TABS.debug.name",
    hint: "CUSTOM_CHAT_TABS.debug.hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });
}
