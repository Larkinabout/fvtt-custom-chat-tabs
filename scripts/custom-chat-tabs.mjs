import { MODULE, SETTING, TAB, TEMPLATE } from "./constants.mjs";
import { getSetting, Logger } from "./utils.mjs";
import { getBuiltInTabs, getOptionalTabs, getUserTabs } from "./tab-registry.mjs";

/**
 * Class managing chat tab state, rendering, and message filtering.
 */
export class CustomChatTabs {
  constructor() {
    this._activeTab = TAB.ALL;
    this._ready = false;
    this._tabs = new Map();
    this._unreadCounts = {};
  }

  /* ---------------------------------------- */
  /*  Initialisation                          */
  /* ---------------------------------------- */

  /**
   * Register tabs.
   */
  initTabs() {
    for ( const tab of getBuiltInTabs() ) {
      this._tabs.set(tab.key, tab);
    }

    for ( const tab of getOptionalTabs() ) {
      this._tabs.set(tab.key, tab);
    }

    for ( const tab of getUserTabs() ) {
      this._tabs.set(tab.key, tab);
    }

    Logger.info(`Initialised with ${this._tabs.size} tabs`);
  }

  /**
   * Call init hook and inject the tab bar.
   */
  ready() {
    this._ready = true;
    Hooks.callAll(`${MODULE.ID}.init`);
    this.injectTabBar(ui.chat.element);
  }

  /* ---------------------------------------- */
  /*  Tab Registration                        */
  /* ---------------------------------------- */

  /**
   * Register a new tab.
   * @param {object} data Tab data
   * @param {string} data.key Tab key
   * @param {string} data.label Tab label
   * @param {string} [data.hint] Tab tooltip text
   * @param {Function} data.filter Tab filter function (message) => boolean
   * @param {string} [data.icon] Tab icon
   * @param {boolean} [data.removable=true] Whether the user can remove this tab
   * @param {boolean} [data.exclusive=false] Whether messages are hidden from the All tab
   * @param {number[]} [data.roles] User roles that can see this tab (all roles if omitted)
   */
  register(data) {
    if ( !data.key || !data.label || !data.filter ) {
      Logger.error("Registration failed: key, label, and filter are required.");
      return;
    }
    if ( this._tabs.has(data.key) ) {
      Logger.warn(`Registration failed: tab "${data.key}" already exists.`);
      return;
    }
    data.removable ??= true;
    data.exclusive ??= false;
    this._tabs.set(data.key, data);
    Logger.debug(`Registered tab "${data.key}"`);
  }

  /**
   * Unregister a tab by key.
   * @param {string} key Tab key to remove
   */
  unregister(key) {
    const tab = this._tabs.get(key);
    if ( !tab ) return;
    if ( !tab.removable ) {
      Logger.warn(`Cannot unregister built-in tab "${key}"`);
      return;
    }
    this._tabs.delete(key);
    if ( this._activeTab === key ) this.setActiveTab(TAB.ALL, document);
    Logger.debug(`Unregistered tab "${key}"`);
  }

  /**
   * Get all registered tabs.
   * @returns {Map} Map of tab key to tab config
   */
  getTabs() {
    return new Map(this._tabs);
  }

  /* ---------------------------------------- */
  /*  Tab Bar Rendering                       */
  /* ---------------------------------------- */

  /**
   * Inject the tab bar into the ChatLog sidebar HTML.
   * @param {HTMLElement} html ChatLog sidebar HTML element
   */
  async injectTabBar(html) {
    const tabsData = Array.from(this._tabs.values())
      .filter(tab => this._hasTabAccess(tab))
      .map(tab => ({
        key: tab.key,
        label: tab.label,
        hint: tab.hint ?? "",
        icon: tab.icon ?? "",
        active: tab.key === this._activeTab,
        pip: this._unreadCounts[tab.key] || 0
      }));

    const showPips = getSetting(SETTING.NOTIFICATION_PIPS.KEY);
    const rendered = await foundry.applications.handlebars.renderTemplate(
      TEMPLATE.TAB_BAR, { tabs: tabsData, showPips }
    );
    const tabBarHtml = document.createElement("div");
    tabBarHtml.innerHTML = rendered;
    const tabBar = tabBarHtml.firstElementChild;

    // Remove existing tab bar if present
    html.querySelector(".custom-chat-tabs-bar")?.remove();

    // Insert before the chat scroll area
    const chatScroll = html.querySelector(".chat-scroll");
    if ( chatScroll ) {
      chatScroll.before(tabBar);
    }

    // Bind tab click events
    tabBar.querySelectorAll("[data-tab]").forEach(el => {
      el.addEventListener("click", event => {
        const key = event.currentTarget.dataset.tab;
        this.setActiveTab(key, html);
      });
    });

    // Bind scroll arrow events
    const list = tabBar.querySelector(".custom-chat-tabs-list");
    const leftArrow = tabBar.querySelector(".custom-chat-tabs-arrow.left");
    const rightArrow = tabBar.querySelector(".custom-chat-tabs-arrow.right");
    if ( list && leftArrow && rightArrow ) {
      const scrollAmount = 100;

      const updateArrows = () => {
        const hasOverflow = list.scrollWidth > list.clientWidth;
        const atLeft = list.scrollLeft <= 0;
        const atRight = list.scrollLeft + list.clientWidth >= list.scrollWidth - 1;
        leftArrow.classList.toggle("visible", hasOverflow && !atLeft);
        rightArrow.classList.toggle("visible", hasOverflow && !atRight);
      };

      leftArrow.addEventListener("click", () => {
        list.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      });

      rightArrow.addEventListener("click", () => {
        list.scrollBy({ left: scrollAmount, behavior: "smooth" });
      });

      list.addEventListener("scroll", updateArrows);
      requestAnimationFrame(updateArrows);
    }

  }

  /* ---------------------------------------- */
  /*  Tab Switching                           */
  /* ---------------------------------------- */

  /**
   * Switch the active tab and re-filter messages.
   * @param {string} key Tab key to activate
   * @param {HTMLElement} html ChatLog HTML element
   */
  setActiveTab(key, html) {
    if ( !this._tabs.has(key) ) return;
    this._activeTab = key;
    this._unreadCounts[key] = 0;

    // Update active class on tab elements
    html.querySelectorAll(".custom-chat-tabs-tab").forEach(el => {
      el.classList.toggle("active", el.dataset.tab === key);
    });

    // Update pip
    const pip = html.querySelector(`.custom-chat-tabs-tab[data-tab="${key}"] .custom-chat-tabs-pip`);
    if ( pip ) pip.classList.remove("active");

    this.filterMessages(html);

    // Scroll to bottom after switching tabs
    const chatScroll = html.querySelector(".chat-scroll");
    if ( chatScroll ) chatScroll.scrollTop = chatScroll.scrollHeight;
  }

  /* ---------------------------------------- */
  /*  Message Filtering                       */
  /* ---------------------------------------- */

  /**
   * Show/hide chat messages based on the active tab's filter.
   * @param {HTMLElement} container The container HTML element
   */
  filterMessages(container) {
    const tab = this._tabs.get(this._activeTab);

    for ( const el of container.querySelectorAll(".chat-log .message[data-message-id]") ) {
      const message = game.messages.get(el.dataset.messageId);
      if ( !message ) {
        el.style.display = "none";
        continue;
      }
      el.style.display = this._isVisible(message, tab) ? "" : "none";
    }
  }

  /* ---------------------------------------- */

  /**
   * Apply the active tab's filter to a single message element.
   * @param {ChatMessage} message Chat message
   * @param {HTMLElement} html HTML element
   */
  filterMessage(message, html) {
    const tab = this._tabs.get(this._activeTab);
    if ( !this._isVisible(message, tab) ) html.style.display = "none";
  }

  /**
   * Check if the current user has access to a tab.
   * @param {object} tab Tab config
   * @returns {boolean} Whether the user can see the tab
   */
  _hasTabAccess(tab) {
    if ( !tab.roles ) return true;
    return tab.roles.includes(game.user.role);
  }

  /**
   * Check if a message should be visible on the active tab.
   * Exclusive tab messages are only visible on their own tab.
   * @param {ChatMessage} message Chat message
   * @param {object} tab Active tab config
   * @returns {boolean} Whether the message should be visible
   */
  _isVisible(message, tab) {
    // Check message-level exclusive flag
    const flags = message.flags?.[MODULE.ID];
    if ( flags?.exclusive ) {
      // Only visible on the tab registered by the flagging module
      const ownerTab = this._tabs.get(flags.module);
      return ownerTab?.key === this._activeTab;
    }

    // If the active tab is exclusive, use its filter directly
    if ( tab?.exclusive ) return tab.filter(message);

    // For All tab or non-exclusive tabs, hide messages claimed by other exclusive tabs
    for ( const other of this._tabs.values() ) {
      if ( !this._hasTabAccess(other) ) continue;
      if ( other.exclusive && other.key !== this._activeTab && other.filter?.(message) ) return false;
    }

    // All tab shows everything not claimed by exclusive tabs
    if ( !tab || this._activeTab === TAB.ALL ) return true;

    // Other tabs use their own filter
    return tab.filter(message);
  }

  /* ---------------------------------------- */
  /*  Notification Pips                       */
  /* ---------------------------------------- */

  /**
   * Process a new message and update unread pips for inactive tabs.
   * @param {ChatMessage} message Chat message
   */
  updatePips(message) {
    if ( !getSetting(SETTING.NOTIFICATION_PIPS.KEY) ) return;

    // Check message-level exclusivity
    const flags = message.flags?.[MODULE.ID];
    if ( flags?.exclusive ) {
      const ownerKey = flags.module;
      if ( ownerKey && ownerKey !== this._activeTab ) {
        const pip = document.querySelector(`.custom-chat-tabs-tab[data-tab="${ownerKey}"] .custom-chat-tabs-pip`);
        if ( pip ) pip.classList.add("active");
      }
      return;
    }

    for ( const [key, tab] of this._tabs ) {
      if ( key === this._activeTab || key === TAB.ALL ) continue;
      if ( !tab.filter || !this._hasTabAccess(tab) ) continue;

      // Tab-level exclusive messages only pip their own tab
      if ( tab.exclusive && tab.filter(message) ) {
        const pip = document.querySelector(`.custom-chat-tabs-tab[data-tab="${key}"] .custom-chat-tabs-pip`);
        if ( pip ) pip.classList.add("active");
        return;
      }

      if ( tab.filter(message) ) {
        const pip = document.querySelector(`.custom-chat-tabs-tab[data-tab="${key}"] .custom-chat-tabs-pip`);
        if ( pip ) pip.classList.add("active");
      }
    }
  }

  /* ---------------------------------------- */
  /*  Flush & Export                           */
  /* ---------------------------------------- */

  /**
   * Delete all messages matching the active tab's filter.
   */
  async flushTab() {
    const tab = this._tabs.get(this._activeTab);
    if ( !tab?.filter ) return;

    const label = tab.label;
    const question = game.i18n.localize("AreYouSure");
    const warning = game.i18n.format("CHAT.FlushWarning");

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: "CHAT.FlushTitle" },
      content: `<p><strong>${question}</strong> ${warning} (${label})</p>`,
      position: {
        top: window.innerHeight - 150,
        left: window.innerWidth - 720
      }
    });
    if ( !confirmed ) return;

    const ids = game.messages.filter(msg => tab.filter(msg)).map(msg => msg.id);
    if ( ids.length ) await ChatMessage.deleteDocuments(ids);
  }

  /**
   * Export messages matching the active tab's filter to a text file.
   */
  exportTab() {
    const tab = this._tabs.get(this._activeTab);
    if ( !tab?.filter ) return;

    const messages = game.messages.filter(msg => tab.filter(msg));
    const log = messages.map(m => m.export()).join("\n---------------------------\n");
    const date = new Date().toDateString().replace(/\s/g, "-");
    const filename = `fvtt-log-${tab.key}-${date}.txt`;
    foundry.utils.saveDataToFile(log, "text/plain", filename);
  }

  /* ---------------------------------------- */
  /*  Pin System                              */
  /* ---------------------------------------- */

  /**
   * Toggle the pin flag on a chat message.
   * @param {string} messageId Chat message ID
   */
  async togglePin(messageId) {
    const message = game.messages.get(messageId);
    if ( !message ) return;
    const isPinned = message.flags?.[MODULE.ID]?.pinned === true;
    await message.setFlag(MODULE.ID, "pinned", !isPinned);

    // Show pip on Pinned tab if not active
    if ( !isPinned && this._activeTab !== TAB.PINNED && getSetting(SETTING.NOTIFICATION_PIPS.KEY) ) {
      const pip = document.querySelector(`.custom-chat-tabs-tab[data-tab="${TAB.PINNED}"] .custom-chat-tabs-pip`);
      if ( pip ) pip.classList.add("active");
    }
  }
}
