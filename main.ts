import { Editor, Menu, Plugin } from 'obsidian';
import './styles.css';
import { TextPreviewModal } from './src/modal';
import { ImageShareSettings, DEFAULT_SETTINGS, ImageShareSettingTab } from './src/settings';
import { setLocale, t } from './src/i18n';

export default class ImageSharePlugin extends Plugin {
	settings: ImageShareSettings;

	async onload() {
		await this.loadSettings();

		// 根据设置初始化界面语言
		setLocale(this.settings.language === 'auto' ? undefined : this.settings.language);

		this.addSettingTab(new ImageShareSettingTab(this.app, this));

		// 注册编辑器右键菜单
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu: Menu, editor: Editor) => {
				const selectedText = editor.getSelection();
				if (selectedText) {
					menu.addItem((item) => {
						item
							.setTitle(t('command.shareAsImage.menu'))
							.setIcon('image')
							.onClick(async () => {
								new TextPreviewModal(this.app, selectedText, this.settings).open();
							});
					});
				}
			})
		);

		// 添加命令到命令面板
		this.addCommand({
			id: 'share-as-image',
			name: t('command.shareAsImage.title'),
			editorCallback: (editor: Editor) => {
				const selectedText = editor.getSelection();
				if (selectedText) {
					new TextPreviewModal(this.app, selectedText, this.settings).open();
				}
			}
		});
	}

	onunload() {
		// 插件卸载时的清理代码
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
