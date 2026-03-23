import { MODULE, TEMPLATE } from "../constants.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Form for editing an individual tab.
 */
export class TabEditForm extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.tabData = options.tabData;
    this.configForm = options.configForm;
  }

  /* ---------------------------------------- */

  static DEFAULT_OPTIONS = {
    id: `${MODULE.ID}-tab-edit`,
    classes: [`${MODULE.ID}-app`],
    tag: "form",
    window: {
      title: "CUSTOM_CHAT_TABS.tabEdit.title",
      minimizable: false,
      resizable: false
    },
    position: {
      width: 320,
      height: "auto"
    },
    actions: {
      saveEdit: TabEditForm.#onSave
    }
  };

  /* ---------------------------------------- */

  static PARTS = {
    form: {
      template: TEMPLATE.TAB_EDIT
    }
  };

  /* ---------------------------------------- */

  async _prepareContext() {
    return {
      label: this.tabData.label,
      icon: this.tabData.icon ?? "",
      iconOnly: this.tabData.iconOnly ?? false
    };
  }

  /* ---------------------------------------- */

  static #onSave() {
    const form = this.element.querySelector("form") ?? this.element;
    const label = form.querySelector("[name='label']").value.trim();
    const icon = form.querySelector("[name='icon']").value.trim();
    const iconOnly = form.querySelector("[name='iconOnly']").checked;

    if ( !label && !iconOnly ) return;

    this.tabData.label = label;
    this.tabData.icon = icon;
    this.tabData.iconOnly = iconOnly;

    this.configForm.render(true);
    this.close();
  }
}
