import { MENU, MODULE, SETTING } from "./constants.mjs";
import { TabConfigForm } from "./forms/tab-config-form.mjs";

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

  game.settings.registerMenu(MODULE.ID, MENU.KEY, {
    name: game.i18n.localize(MENU.NAME),
    hint: game.i18n.localize(MENU.HINT),
    label: game.i18n.localize(MENU.LABEL),
    icon: MENU.ICON,
    type: TabConfigForm,
    restricted: true
  });

  game.settings.register(MODULE.ID, SETTING.TABS.KEY, {
    scope: "world",
    config: false,
    type: Array,
    default: [],
    onChange: () => { game.customChatTabs.togglePinIndicators(); }
  });

  game.settings.register(MODULE.ID, SETTING.SHOW_PIN_BUTTON.KEY, {
    name: "CUSTOM_CHAT_TABS.showPinButton.name",
    hint: "CUSTOM_CHAT_TABS.showPinButton.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => { game.customChatTabs.togglePinIndicators(); }
  });

  game.settings.register(MODULE.ID, SETTING.NOTIFICATION_PIPS.KEY, {
    name: "CUSTOM_CHAT_TABS.notificationPips.name",
    hint: "CUSTOM_CHAT_TABS.notificationPips.hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
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
