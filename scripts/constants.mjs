export const MODULE = {
  ID: "custom-chat-tabs",
  NAME: "Custom Chat Tabs"
};

export const MENU = {
  KEY: "tabConfig",
  ICON: "fas fa-bars",
  LABEL: "CUSTOM_CHAT_TABS.tabConfig.label",
  NAME: "CUSTOM_CHAT_TABS.tabConfig.name",
  HINT: "CUSTOM_CHAT_TABS.tabConfig.hint"
};

export const SETTING = {
  ENABLE: {
    KEY: "enable"
  },
  TABS: {
    KEY: "tabs"
  },
  SHOW_PIN_BUTTON: {
    KEY: "showPinButton"
  },
  NOTIFICATION_PIPS: {
    KEY: "notificationPips"
  },
  DEBUG: {
    KEY: "debug"
  }
};

export const TEMPLATE = {
  TAB_BAR: `modules/${MODULE.ID}/templates/tab-bar.hbs`,
  TAB_CONFIG: `modules/${MODULE.ID}/templates/tab-config-form.hbs`,
  TAB_EDIT: `modules/${MODULE.ID}/templates/tab-edit-form.hbs`
};

export const TAB = {
  ALL: "all",
  PINNED: "pinned",
  IC: "ic",
  OOC: "ooc",
  ROLLS: "rolls",
  WHISPERS: "whispers"
};
