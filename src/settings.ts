import { App, PluginSettingTab, Setting, DropdownComponent } from 'obsidian';
import type ImageSharePlugin from '../main';
import { t, setLocale, Locale } from './i18n';
import { TEMPLATE_IDS, STYLE_IDS } from './templates';

export interface ImageShareSettings {
	defaultTheme: string;
	defaultStyle: string;
	format: 'png' | 'jpeg';
	quality: number;
	language: 'auto' | Locale;
}

export const DEFAULT_SETTINGS: ImageShareSettings = {
	defaultTheme: TEMPLATE_IDS[0],
	defaultStyle: STYLE_IDS[0],
	format: 'png',
	quality: 0.92,
	language: 'auto',
};

export class ImageShareSettingTab extends PluginSettingTab {
	private plugin: ImageSharePlugin;

	constructor(app: App, plugin: ImageSharePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', { text: t('settings.title') });

		new Setting(containerEl)
			.setName(t('settings.appearance'))
			.setHeading();

		new Setting(containerEl)
			.setName(t('settings.defaultTheme'))
			.setDesc(t('settings.defaultTheme.desc'))
			.addDropdown((dropdown: DropdownComponent) => {
				dropdown
					.addOption('light', t('template.light'))
					.addOption('dark', t('template.dark'))
					.setValue(this.plugin.settings.defaultTheme)
					.onChange(async (value) => {
						this.plugin.settings.defaultTheme = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(t('settings.defaultStyle'))
			.setDesc(t('settings.defaultStyle.desc'))
			.addDropdown((dropdown) => {
				dropdown
					.addOption('default', t('style.default'))
					.addOption('modern', t('style.modern'))
					.addOption('minimal', t('style.minimal'))
					.setValue(this.plugin.settings.defaultStyle)
					.onChange(async (value) => {
						this.plugin.settings.defaultStyle = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(t('settings.export'))
			.setHeading();

		new Setting(containerEl)
			.setName(t('settings.format'))
			.setDesc(t('settings.format.desc'))
			.addDropdown((dropdown) => {
				dropdown
					.addOption('png', 'PNG')
					.addOption('jpeg', 'JPEG')
					.setValue(this.plugin.settings.format)
					.onChange(async (value) => {
						this.plugin.settings.format = value as 'png' | 'jpeg';
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(t('settings.quality'))
			.setDesc(t('settings.quality.desc'))
			.addSlider((slider) => {
				slider
					.setLimits(50, 100, 1)
					.setValue(Math.round(this.plugin.settings.quality * 100))
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.quality = value / 100;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(t('settings.i18n'))
			.setHeading();

		new Setting(containerEl)
			.setName(t('settings.language'))
			.setDesc(t('settings.language.desc'))
			.addDropdown((dropdown) => {
				dropdown
					.addOption('auto', t('misc.language.auto'))
					.addOption('zh-CN', '简体中文')
					.addOption('en', 'English')
					.setValue(this.plugin.settings.language)
					.onChange(async (value) => {
						this.plugin.settings.language = value as ImageShareSettings['language'];
						setLocale(value === 'auto' ? undefined : (value as Locale));
						await this.plugin.saveSettings();
						this.display();
					});
			});
	}
}
