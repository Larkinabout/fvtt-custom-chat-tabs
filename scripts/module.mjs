import { MODULE, SETTING, TAB, TEMPLATE } from "./constants.mjs";
import { getSetting, Logger } from "./utils.mjs";
import { registerSettings } from "./settings.mjs";
import { registerMigrationSetting, migrate } from "./migration.mjs";
import { CustomChatTabs } from "./custom-chat-tabs.mjs";

/* ---------------------------------------- */
/*  Init                                    */
/* ---------------------------------------- */

Hooks.on("init", () => {
  Logger.info("Initialising...");

  registerSettings();
  registerMigrationSetting();

  const instance = new CustomChatTabs();
  game.customChatTabs = instance;

  const module = game.modules.get(MODULE.ID);
  module.api = {
    register: instance.register.bind(instance),
    unregister: instance.unregister.bind(instance),
    getTabs: instance.getTabs.bind(instance),
    setActiveTab: instance.setActiveTab.bind(instance),
    togglePin: instance.togglePin.bind(instance)
  };

  foundry.applications.handlebars.loadTemplates([
    TEMPLATE.TAB_BAR,
    TEMPLATE.TAB_CONFIG,
    TEMPLATE.TAB_EDIT
  ]);
});

/* ---------------------------------------- */
/*  Ready                                   */
/* ---------------------------------------- */

Hooks.on("ready", async () => {
  await migrate();
  if ( !getSetting(SETTING.ENABLE.KEY) ) return;

  game.customChatTabs.initTabs();
  game.customChatTabs.ready();
  Logger.info("Ready");
});

/* ---------------------------------------- */
/*  Canvas Ready                            */
/* ---------------------------------------- */

Hooks.on("canvasReady", () => {
  if ( !getSetting(SETTING.ENABLE.KEY) ) return;
  if ( !game.customChatTabs._ready ) return;
  if ( game.customChatTabs._activeTab !== TAB.SCENE ) return;

  game.customChatTabs.filterMessages(document);
});

/* ---------------------------------------- */
/*  Render Chat Input                       */
/* ---------------------------------------- */

Hooks.on("renderChatInput", (app, elements) => {
  if ( !getSetting(SETTING.ENABLE.KEY) ) return;

  const controls = elements["#chat-controls"];
  if ( !controls ) return;

  // Rename data-action and register custom actions for tab-scoped flush/export
  const flushBtn = controls.querySelector("[data-action='flush']");
  if ( flushBtn ) flushBtn.dataset.action = "customChatTabsFlush";

  const exportBtn = controls.querySelector("[data-action='export']");
  if ( exportBtn ) exportBtn.dataset.action = "customChatTabsExport";

  const actions = app.options.actions;
  actions.customChatTabsFlush ??= function() {
    if ( game.customChatTabs._activeTab === "all" ) game.messages.flush();
    else game.customChatTabs.flushTab();
  };
  actions.customChatTabsExport ??= function() {
    if ( game.customChatTabs._activeTab === "all" ) game.messages.export();
    else game.customChatTabs.exportTab();
  };
});

/* ---------------------------------------- */
/*  Render Chat Log                         */
/* ---------------------------------------- */

Hooks.on("renderChatLog", (app, html) => {
  if ( !getSetting(SETTING.ENABLE.KEY) ) return;
  if ( !game.customChatTabs._ready ) return;

  game.customChatTabs.injectTabBar(html);
});

/* ---------------------------------------- */
/*  Render Chat Message                     */
/* ---------------------------------------- */

Hooks.on("renderChatMessageHTML", (message, html) => {
  if ( !getSetting(SETTING.ENABLE.KEY) ) return;

  // Add pin icon to pinned messages
  const hasPinnedTab = game.customChatTabs.hasTab(TAB.PINNED);

  if ( hasPinnedTab && getSetting(SETTING.SHOW_PIN_BUTTON.KEY) ) {
    game.customChatTabs.addPinIndicator(message, html);
  }

  // Apply active tab filter to message
  game.customChatTabs.filterMessage(message, html);
});

/* ---------------------------------------- */
/*  Create Chat Message                     */
/* ---------------------------------------- */

Hooks.on("createChatMessage", message => {
  if ( !getSetting(SETTING.ENABLE.KEY) ) return;

  game.customChatTabs.updatePips(message);
});

/* ---------------------------------------- */
/*  Chat Message Context Menu               */
/* ---------------------------------------- */

Hooks.on("getChatMessageContextOptions", (html, menuItems) => {
  if ( !getSetting(SETTING.ENABLE.KEY) ) return;

  // Pin option
  menuItems.push({
    name: "CUSTOM_CHAT_TABS.pin",
    icon: '<i class="fas fa-thumbtack"></i>',
    condition: li => {
      if ( !game.customChatTabs._tabs.has(TAB.PINNED) ) return false;
      const message = game.messages.get(li.dataset.messageId);
      return message?.canUserModify(game.user, "update") && !message.flags?.[MODULE.ID]?.pinned;
    },
    callback: li => {
      game.customChatTabs.togglePin(li.dataset.messageId);
    }
  });

  // Unpin option
  menuItems.push({
    name: "CUSTOM_CHAT_TABS.unpin",
    icon: '<i class="fas fa-thumbtack-angle"></i>',
    condition: li => {
      if ( !game.customChatTabs._tabs.has(TAB.PINNED) ) return false;
      const message = game.messages.get(li.dataset.messageId);
      return message?.canUserModify(game.user, "update") && message.flags?.[MODULE.ID]?.pinned === true;
    },
    callback: li => {
      game.customChatTabs.togglePin(li.dataset.messageId);
    }
  });
});
