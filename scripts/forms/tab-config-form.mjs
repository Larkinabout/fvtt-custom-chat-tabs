import { MODULE, SETTING, TAB, TEMPLATE } from "../constants.mjs";
import { getSetting, Logger } from "../utils.mjs";
import { getPresetTabs } from "../tab-registry.mjs";
import { TabEditForm } from "./tab-edit-form.mjs";

const BUILT_IN_KEYS = new Set([TAB.ALL]);

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Form for configuring tabs.
 */
export class TabConfigForm extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this._available = [];
    this._selected = [];
    this._highlightedAvailable = null;
    this._highlightedSelected = null;
    this._loadData();
  }

  /* ---------------------------------------- */

  static DEFAULT_OPTIONS = {
    id: `${MODULE.ID}-tab-config`,
    classes: [`${MODULE.ID}-app`],
    window: {
      title: "CUSTOM_CHAT_TABS.tabConfig.title",
      minimizable: false,
      resizable: true
    },
    position: {
      width: 520,
      height: 400
    },
    actions: {
      addTab: TabConfigForm.#onAddTab,
      removeTab: TabConfigForm.#onRemoveTab,
      moveUp: TabConfigForm.#onMoveUp,
      moveDown: TabConfigForm.#onMoveDown,
      editTab: TabConfigForm.#onEditTab,
      save: TabConfigForm.#onSave
    }
  };

  /* ---------------------------------------- */

  static PARTS = {
    form: {
      template: TEMPLATE.TAB_CONFIG
    }
  };

  /* ---------------------------------------- */

  /**
   * Load current setting data into available/active lists.
   */
  _loadData() {
    const activeTabs = foundry.utils.deepClone(getSetting(SETTING.TABS.KEY) ?? []);
    const presets = getPresetTabs();
    const presetMap = new Map(presets.map(p => [p.key, p]));
    const activeKeys = new Set(activeTabs.map(t => t.key));

    // Resolve original labels and external status for saved tabs
    for ( const tab of activeTabs ) {
      const preset = presetMap.get(tab.key);
      tab.originalLabel ??= preset?.label ?? tab.label;

      // Re-detect external status if missing
      if ( !tab.external && !preset && game.customChatTabs?._tabs.has(tab.key) ) {
        tab.external = true;
      }
    }

    // Include API-registered tabs not already in the active list
    if ( game.customChatTabs?._tabs ) {
      for ( const [key, tab] of game.customChatTabs._tabs ) {
        if ( BUILT_IN_KEYS.has(key) || activeKeys.has(key) ) continue;
        activeTabs.push({
          key: tab.key,
          label: tab.label,
          originalLabel: tab.label,
          icon: tab.icon ?? "",
          iconOnly: tab.iconOnly ?? false,
          external: true
        });
        activeKeys.add(key);
      }
    }

    this._selected = activeTabs;
    this._available = presets.filter(p => !activeKeys.has(p.key));
    this._sortAvailable();
  }

  /* ---------------------------------------- */

  /**
   * Sort available tabs alphabetically by original label.
   */
  _sortAvailable() {
    this._available.sort((a, b) => {
      const labelA = (a.originalLabel ?? a.label).toLowerCase();
      const labelB = (b.originalLabel ?? b.label).toLowerCase();
      return labelA.localeCompare(labelB);
    });
  }

  /* ---------------------------------------- */

  async _prepareContext() {
    return {
      available: this._available,
      selected: this._selected,
      highlightedAvailable: this._highlightedAvailable,
      highlightedSelected: this._highlightedSelected
    };
  }

  /* ---------------------------------------- */

  _onRender(context, options) {
    super._onRender(context, options);
    this._bindListSelection();
    this._bindDragDrop();
  }

  /* ---------------------------------------- */

  /**
   * Bind click-to-select on list items.
   */
  _bindListSelection() {
    this.element.querySelectorAll(".custom-chat-tabs-config-item").forEach(item => {
      item.addEventListener("click", event => {
        if ( event.target.closest("[data-action]") ) return;
        const list = item.closest("[data-list]").dataset.list;
        const key = item.dataset.key;

        // Deselect previous
        this.element.querySelectorAll(`[data-list="${list}"] .custom-chat-tabs-config-item`).forEach(el => {
          el.classList.remove("highlighted");
        });

        item.classList.add("highlighted");
        if ( list === "available" ) this._highlightedAvailable = key;
        else this._highlightedSelected = key;
      });
    });
  }

  /* ---------------------------------------- */

  /**
   * Bind drag and drop for reordering and transferring.
   */
  _bindDragDrop() {
    const items = this.element.querySelectorAll(".custom-chat-tabs-config-item");
    const lists = this.element.querySelectorAll(".custom-chat-tabs-config-list");
    let dropAfter = false;

    items.forEach(item => {
      item.addEventListener("dragstart", event => {
        event.dataTransfer.setData("text/plain", JSON.stringify({
          key: item.dataset.key,
          list: item.closest("[data-list]").dataset.list
        }));
        item.classList.add("dragging");
      });

      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        this.element.querySelectorAll(".drag-over-top, .drag-over-bottom").forEach(el => {
          el.classList.remove("drag-over-top", "drag-over-bottom");
        });
      });
    });

    lists.forEach(list => {
      list.addEventListener("dragover", event => {
        event.preventDefault();
        const target = event.target.closest(".custom-chat-tabs-config-item");
        list.querySelectorAll(".drag-over-top, .drag-over-bottom").forEach(el => {
          el.classList.remove("drag-over-top", "drag-over-bottom");
        });
        if ( target ) {
          const rect = target.getBoundingClientRect();
          dropAfter = (event.clientY - rect.top) / rect.height > 0.5;
          target.classList.add(dropAfter ? "drag-over-bottom" : "drag-over-top");
        }
      });

      list.addEventListener("dragleave", event => {
        const target = event.target.closest(".custom-chat-tabs-config-item");
        if ( target ) target.classList.remove("drag-over-top", "drag-over-bottom");
      });

      list.addEventListener("drop", event => {
        event.preventDefault();
        list.querySelectorAll(".drag-over-top, .drag-over-bottom").forEach(el => {
          el.classList.remove("drag-over-top", "drag-over-bottom");
        });

        const data = JSON.parse(event.dataTransfer.getData("text/plain"));
        const targetList = list.dataset.list;
        const dropTarget = event.target.closest(".custom-chat-tabs-config-item");
        const dropKey = dropTarget?.dataset.key;

        this._handleDrop(data.key, data.list, targetList, dropKey, dropAfter);
      });
    });
  }

  /* ---------------------------------------- */

  /**
   * Handle a drop operation.
   * @param {string} dragKey Key of the dragged item
   * @param {string} sourceList Source list ("available" or "selected")
   * @param {string} targetList Target list ("available" or "selected")
   * @param {string} [dropKey] Key of the item dropped onto
   * @param {boolean} [after=false] Whether to insert after the drop target
   */
  _handleDrop(dragKey, sourceList, targetList, dropKey, after = false) {
    if ( sourceList === targetList ) {
      // Reorder within the same list
      if ( targetList === "selected" ) {
        const arr = this._selected;
        const fromIdx = arr.findIndex(t => t.key === dragKey);
        let toIdx = dropKey ? arr.findIndex(t => t.key === dropKey) : arr.length;
        if ( fromIdx === -1 || fromIdx === toIdx ) return;
        const [item] = arr.splice(fromIdx, 1);
        // Adjust index after removal
        if ( dropKey ) {
          toIdx = arr.findIndex(t => t.key === dropKey);
          if ( after ) toIdx += 1;
        }
        arr.splice(toIdx, 0, item);
      }
    } else if ( sourceList === "available" && targetList === "selected" ) {
      // Move from available to selected
      const idx = this._available.findIndex(t => t.key === dragKey);
      if ( idx === -1 ) return;
      const [item] = this._available.splice(idx, 1);
      item.originalLabel ??= item.label;
      let insertIdx = dropKey ? this._selected.findIndex(t => t.key === dropKey) : this._selected.length;
      if ( insertIdx === -1 ) insertIdx = this._selected.length;
      else if ( after ) insertIdx += 1;
      this._selected.splice(insertIdx, 0, item);
    } else if ( sourceList === "selected" && targetList === "available" ) {
      // Move from selected to available (external tabs cannot be removed)
      const idx = this._selected.findIndex(t => t.key === dragKey);
      if ( idx === -1 ) return;
      const item = this._selected[idx];
      if ( item.external ) return;
      this._selected.splice(idx, 1);
      this._available.push(item);
      this._sortAvailable();
    }

    this.render(true);
  }

  /* ---------------------------------------- */
  /*  Actions                                 */
  /* ---------------------------------------- */

  /**
   * Move highlighted item from available to selected.
   */
  static #onAddTab() {
    if ( !this._highlightedAvailable ) return;
    const idx = this._available.findIndex(t => t.key === this._highlightedAvailable);
    if ( idx === -1 ) return;
    const [item] = this._available.splice(idx, 1);
    item.originalLabel ??= item.label;
    this._selected.push(item);
    this._highlightedAvailable = null;
    this.render(true);
  }

  /**
   * Move highlighted item from selected to available.
   */
  static #onRemoveTab() {
    if ( !this._highlightedSelected ) return;
    const idx = this._selected.findIndex(t => t.key === this._highlightedSelected);
    if ( idx === -1 ) return;
    const item = this._selected[idx];
    if ( item.external ) return;
    this._selected.splice(idx, 1);
    this._available.push(item);
    this._sortAvailable();
    this._highlightedSelected = null;
    this.render(true);
  }

  /**
   * Move highlighted selected item up.
   */
  static #onMoveUp() {
    if ( !this._highlightedSelected ) return;
    const idx = this._selected.findIndex(t => t.key === this._highlightedSelected);
    if ( idx <= 0 ) return;
    [this._selected[idx - 1], this._selected[idx]] = [this._selected[idx], this._selected[idx - 1]];
    this.render(true);
  }

  /**
   * Move highlighted selected item down.
   */
  static #onMoveDown() {
    if ( !this._highlightedSelected ) return;
    const idx = this._selected.findIndex(t => t.key === this._highlightedSelected);
    if ( idx === -1 || idx >= this._selected.length - 1 ) return;
    [this._selected[idx], this._selected[idx + 1]] = [this._selected[idx + 1], this._selected[idx]];
    this.render(true);
  }

  /**
   * Edit the tab.
   * @param {Event} event The triggering event
   * @param {HTMLElement} target The target element
   */
  static #onEditTab(event, target) {
    const item = target.closest(".custom-chat-tabs-config-item");
    if ( !item ) return;
    const key = item.dataset.key;
    const tabData = this._selected.find(t => t.key === key) ?? this._available.find(t => t.key === key);
    if ( !tabData ) return;

    new TabEditForm({ tabData, configForm: this }).render(true);
  }

  /**
   * Save the selected tabs to the setting and reload.
   */
  static async #onSave() {
    const tabsData = this._selected.map(tab => ({
      key: tab.key,
      label: tab.label,
      originalLabel: tab.originalLabel ?? tab.label,
      icon: tab.icon ?? "",
      iconOnly: tab.iconOnly ?? false,
      preset: tab.preset,
      config: tab.config ?? {},
      external: tab.external ?? false
    }));

    await game.settings.set(MODULE.ID, SETTING.TABS.KEY, tabsData);
    Logger.info("Tab configuration saved");
    this.close();
    SettingsConfig.reloadConfirm({ world: true });
  }
}
