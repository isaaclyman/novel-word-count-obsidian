import type NovelWordCountPlugin from "main";
import { CountsByFile } from "./file";
import {
	$CountType,
	COUNT_TYPES,
	DEFAULT_SETTINGS,
	NovelWordCountSettings,
} from "./settings";

export interface NovelWordCountSavedData {
	cachedCounts: CountsByFile;
	settings: NovelWordCountSettings;
}

export class SavedDataHelper {
	constructor(private plugin: NovelWordCountPlugin) {}

	async getSavedData(): Promise<NovelWordCountSavedData> {
		const loaded: NovelWordCountSavedData = await this.plugin.loadData();

		const denulled = Object.assign({}, loaded);
		denulled.settings = Object.assign({}, DEFAULT_SETTINGS, denulled.settings);

		const migrated = migrateSavedData(denulled);

		return migrated;
	}
}

// SAVED DATA MIGRATIONS

export function migrateSavedData(
	saved: NovelWordCountSavedData
): NovelWordCountSavedData {
	const migrations: MigrationFunction[] = [
		overwriteInvalidCountTypes,
		migrateToCountConfigurationObject,
	];

	for (const migrate of migrations) {
		saved = migrate(saved);
	}

	return saved;
}

type MigrationFunction = (
	saved: NovelWordCountSavedData
) => NovelWordCountSavedData;

type KeysOfType<T, TProp> = {
	[P in keyof T]: T[P] extends TProp ? P : never;
}[keyof T];

const overwriteInvalidCountTypes: MigrationFunction = (saved) => {
	if (!saved?.settings?.countType) {
		return;
	}

	const fieldsToCheck: KeysOfType<NovelWordCountSettings, $CountType>[] = [
		"countType",
		"countType2",
		"countType3",
		"folderCountType",
		"folderCountType2",
		"folderCountType3",
		"rootCountType",
		"rootCountType2",
		"rootCountType3",
	];

	for (const field of fieldsToCheck) {
		if (!COUNT_TYPES.includes(saved.settings[field])) {
			saved.settings[field] =
				field === "countType" ? $CountType.Word : $CountType.None;
		}
	}

	return saved;
};

const migrateToCountConfigurationObject: MigrationFunction = (saved) => {
	const settings = saved.settings;
	const oldSettings = saved.settings as unknown as Record<string, unknown>;

	// NOTES

	settings.countConfig ??= {};
	if (typeof oldSettings.countTypeSuffix === "string") {
		settings.countConfig.customSuffix = oldSettings.countTypeSuffix;
		delete oldSettings.countTypeSuffix;
	}

	if (typeof oldSettings.frontmatterKey === "string") {
		settings.countConfig.frontmatterKey = oldSettings.frontmatterKey;
		delete oldSettings.frontmatterKey;
	}

	settings.countConfig2 ??= {};
	if (typeof oldSettings.countType2Suffix === "string") {
		settings.countConfig2.customSuffix = oldSettings.countType2Suffix;
		delete oldSettings.countType2Suffix;
	}

	if (typeof oldSettings.frontmatterKey2 === "string") {
		settings.countConfig2.frontmatterKey = oldSettings.frontmatterKey2;
		delete oldSettings.frontmatterKey2;
	}

	settings.countConfig3 ??= {};
	if (typeof oldSettings.countType3Suffix === "string") {
		settings.countConfig3.customSuffix = oldSettings.countType3Suffix;
		delete oldSettings.countType3Suffix;
	}

	if (typeof oldSettings.frontmatterKey3 === "string") {
		settings.countConfig3.frontmatterKey = oldSettings.frontmatterKey3;
		delete oldSettings.frontmatterKey3;
	}

	// FOLDERS

	settings.folderCountConfig ??= {};
	if (typeof oldSettings.folderCountTypeSuffix === "string") {
		settings.folderCountConfig.customSuffix = oldSettings.folderCountTypeSuffix;
		delete oldSettings.folderCountTypeSuffix;
	}

	settings.folderCountConfig2 ??= {};
	if (typeof oldSettings.folderCountType2Suffix === "string") {
		settings.folderCountConfig2.customSuffix =
			oldSettings.folderCountType2Suffix;
		delete oldSettings.folderCountType2Suffix;
	}

	settings.folderCountConfig3 ??= {};
	if (typeof oldSettings.folderCountType3Suffix === "string") {
		settings.folderCountConfig3.customSuffix =
			oldSettings.folderCountType3Suffix;
		delete oldSettings.folderCountType3Suffix;
	}

	// ROOT

	settings.rootCountConfig ??= {};
	if (typeof oldSettings.rootCountTypeSuffix === "string") {
		settings.rootCountConfig.customSuffix = oldSettings.rootCountTypeSuffix;
		delete oldSettings.rootCountTypeSuffix;
	}

	settings.rootCountConfig2 ??= {};
	if (typeof oldSettings.rootCountType2Suffix === "string") {
		settings.rootCountConfig2.customSuffix = oldSettings.rootCountType2Suffix;
		delete oldSettings.rootCountType2Suffix;
	}

	settings.rootCountConfig3 ??= {};
	if (typeof oldSettings.rootCountType3Suffix === "string") {
		settings.rootCountConfig3.customSuffix = oldSettings.rootCountType3Suffix;
		delete oldSettings.rootCountType3Suffix;
	}

	return saved;
};
