export const MODULE = {
  ID: "custom-chat-tabs",
  NAME: "Custom Chat Tabs"
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
  },
  TAB_IC: {
    KEY: "tabIC"
  },
  TAB_OOC: {
    KEY: "tabOOC"
  },
  TAB_ROLLS: {
    KEY: "tabRolls"
  },
  TAB_WHISPERS: {
    KEY: "tabWhispers"
  }
};

export const TEMPLATE = {
  TAB_BAR: `modules/${MODULE.ID}/templates/tab-bar.hbs`
};

export const TAB = {
  ALL: "all",
  PINNED: "pinned",
  IC: "ic",
  OOC: "ooc",
  ROLLS: "rolls",
  WHISPERS: "whispers"
};
