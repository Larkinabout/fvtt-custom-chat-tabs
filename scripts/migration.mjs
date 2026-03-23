import { MODULE, SETTING, TAB } from "./constants.mjs";
import { getSetting, setSetting, Logger } from "./utils.mjs";

const MIGRATION_VERSION_KEY = "migrationVersion";

/**
 * Register the migration version setting.
 */
export function registerMigrationSetting() {
  game.settings.register(MODULE.ID, MIGRATION_VERSION_KEY, {
    scope: "world",
    config: false,
    type: String,
    default: ""
  });
}

/* ---------------------------------------- */

/**
 * Run migrations between module versions.
 */
export async function migrate() {
  if ( !game.user.isGM ) return;

  const moduleVersion = game.modules.get(MODULE.ID).version;
  const migrationVersion = getSetting(MIGRATION_VERSION_KEY);

  if ( moduleVersion === migrationVersion ) return;

  let isSuccess = true;

  if ( !migrationVersion || foundry.utils.isNewerVersion("1.1.0", migrationVersion) ) {
    isSuccess = await migrateTabCheckboxesToArray();
  }

  if ( isSuccess ) {
    await setSetting(MIGRATION_VERSION_KEY, moduleVersion);
  }
}

/* ---------------------------------------- */

/**
 * Migrate individual tab checkbox settings into the tabs array setting.
 * @returns {Promise<boolean>} Whether the migration was successful
 */
async function migrateTabCheckboxesToArray() {
  try {
    Logger.info("Migrating tab settings...");

    const existingTabs = getSetting(SETTING.TABS.KEY);
    if ( Array.isArray(existingTabs) && existingTabs.length > 0 ) {
      Logger.info("Tabs setting already populated, skipping migration.");
      return true;
    }

    const tabs = [];
    const storage = [...game.settings.storage.get("world")];

    const legacySettings = [
      { key: "tabIC", tabKey: TAB.IC, label: "IC", preset: "type", config: { types: [CONST.CHAT_MESSAGE_STYLES.IC] } },
      { key: "tabOOC", tabKey: TAB.OOC, label: "OOC", preset: "type", config: { types: [CONST.CHAT_MESSAGE_STYLES.OOC] } },
      { key: "tabRolls", tabKey: TAB.ROLLS, label: "Rolls", preset: "roll", config: {} },
      { key: "tabWhispers", tabKey: TAB.WHISPERS, label: "Whispers", preset: "whisper", config: {} }
    ];

    for ( const { key, tabKey, label, preset, config } of legacySettings ) {
      const setting = storage.find(s => s.key === `${MODULE.ID}.${key}`);
      if ( setting?.value === true ) {
        tabs.push({ key: tabKey, label, preset, config, icon: "", iconOnly: false });
      }
    }

    if ( tabs.length > 0 ) {
      await setSetting(SETTING.TABS.KEY, tabs);
      Logger.info(`Migrated ${tabs.length} tab(s) to new format.`);
    } else {
      Logger.info("No legacy tab settings found.");
    }

    return true;
  } catch ( err ) {
    Logger.error("Tab migration failed:", err);
    return false;
  }
}
