import { App, Modal } from 'obsidian';
import { ImageGenerator } from './generator';
import { ImageShareSettings } from './settings';
import { SHARE_TEMPLATES, MARKDOWN_STYLES } from './templates';
import { createIcon } from './icons';
import { showToast } from './toast';
import { t } from './i18n';

/** Modern preview dialog: responsive layout for desktop (two-column) and mobile (preview + bottom controls). */
export class TextPreviewModal extends Modal {
	private readonly text: string;
	private imageGenerator: ImageGenerator;
	private readonly settings: ImageShareSettings;
	private eventCleanups: (() => void)[] = [];

	constructor(app: App, text: string, settings: ImageShareSettings) {
		super(app);
		this.text = text;
		this.settings = settings;
		this.imageGenerator = new ImageGenerator(app, text, settings);
	}

	/** Add an event listener that is cleaned up automatically when the modal closes. */
	private addListener<K extends keyof HTMLElementEventMap>(
		element: HTMLElement,
		type: K | string,
		handler: (e: Event) => void
	): void {
		element.addEventListener(type, handler as EventListener);
		this.eventCleanups.push(() => element.removeEventListener(type, handler as EventListener));
	}

	async onOpen() {
		const { contentEl, modalEl } = this;
		contentEl.empty();

		// 给外层弹窗和内层内容容器添加专属类名
		modalEl.addClass('image-share-modal-window');
		contentEl.addClass('image-share-modal-content');

		const container = contentEl.createDiv({ cls: 'share-container' });

		// ---------- 控制面板 (桌面在左，移动端在下) ----------
		const controlsPanel = container.createDiv({ cls: 'controls-panel' });

		// 面板标题 (桌面端显示)
		controlsPanel.createDiv({
			text: t('panel.imageSettings'),
			cls: 'panel-title desktop-only-title'
		});

		// 可滚动设置内容区
		const controlsScrollable = controlsPanel.createDiv({ cls: 'controls-scrollable' });

		// ---------- 主题选择（卡片式 / 紧凑胶囊） ----------
		const themeSection = controlsScrollable.createDiv({ cls: 'control-section theme-section' });
		themeSection.createDiv({ text: t('section.theme'), cls: 'section-title' });

		const templateSelector = themeSection.createDiv({ cls: 'template-selector' });

		SHARE_TEMPLATES.forEach((template) => {
			const isActive = template.id === this.imageGenerator.getCurrentTemplate().id;
			const card = templateSelector.createDiv({
				cls: `option-card theme-card${isActive ? ' active' : ''}`,
				attr: { role: 'button', tabindex: '0', 'aria-label': t(template.nameKey) }
			});
			card.createDiv({ cls: `theme-swatch ${template.id === 'dark' ? 'swatch-dark' : 'swatch-light'}` });
			
			const labelContainer = card.createDiv({ cls: 'option-label-wrap' });
			labelContainer.createDiv({ cls: 'option-label', text: t(template.nameKey) });

			const activateTemplate = async () => {
				templateSelector.findAll('.option-card').forEach((el) => el.removeClass('active'));
				card.addClass('active');

				await this.refreshPreview(async () => {
					await this.imageGenerator.setTemplate(template.id);
				}, canvasContainer);
			};

			this.addListener(card, 'click', activateTemplate);
			this.addListener(card, 'keydown', (e: KeyboardEvent) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					void activateTemplate();
				}
			});
		});

		// ---------- 样式选择 ----------
		const styleSection = controlsScrollable.createDiv({ cls: 'control-section style-section' });
		styleSection.createDiv({ text: t('section.style'), cls: 'section-title' });

		const styleSelector = styleSection.createDiv({ cls: 'style-selector' });

		MARKDOWN_STYLES.forEach((style) => {
			const isActive = style.id === this.imageGenerator.getCurrentStyle();
			const card = styleSelector.createDiv({
				cls: `option-card style-card${isActive ? ' active' : ''}`,
				attr: { role: 'button', tabindex: '0', 'data-style': style.id, 'aria-label': t(style.nameKey) }
			});
			const textWrap = card.createDiv({ cls: 'style-card-text' });
			textWrap.createDiv({ cls: 'option-label', text: t(style.nameKey) });
			textWrap.createDiv({ cls: 'option-desc', text: t(style.descKey) });

			const activateStyle = async () => {
				styleSelector.findAll('.option-card').forEach((el) => el.removeClass('active'));
				card.addClass('active');

				await this.refreshPreview(async () => {
					await this.imageGenerator.setStyle(style.id);
				}, canvasContainer);
			};

			this.addListener(card, 'click', activateStyle);
			this.addListener(card, 'keydown', (e: KeyboardEvent) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					void activateStyle();
				}
			});
		});

		// ---------- 导出操作区域 (桌面在侧栏底部，移动端固定底部工具条) ----------
		const exportSection = controlsPanel.createDiv({ cls: 'control-section export-section' });
		exportSection.createDiv({ text: t('section.export'), cls: 'section-title desktop-only-title' });

		const buttonsContainer = exportSection.createDiv({ cls: 'buttons-container' });

		// 下载按钮（主操作）
		const downloadButton = buttonsContainer.createEl('button', {
			cls: 'elegant-button primary-button download-button',
			attr: { 'aria-label': t('aria.download'), type: 'button' }
		});
		downloadButton.appendChild(createIcon('download-icon') as Node);
		downloadButton.createSpan({ text: t('action.download') });

		// 复制按钮
		const copyButton = buttonsContainer.createEl('button', {
			cls: 'elegant-button secondary-button copy-button',
			attr: { 'aria-label': t('aria.copy'), type: 'button' }
		});
		copyButton.appendChild(createIcon('copy-icon') as Node);
		copyButton.createSpan({ text: t('action.copy') });

		// ---------- 预览面板 (桌面在右，移动端在顶部/主体) ----------
		const previewPanel = container.createDiv({ cls: 'preview-panel' });
		const previewHeader = previewPanel.createDiv({ cls: 'preview-header' });
		previewHeader.createDiv({ text: t('panel.preview'), cls: 'panel-title preview-title' });

		const canvasContainer = previewPanel.createDiv({ cls: 'canvas-container' });

		// 初始渲染并显示预览
		await this.refreshPreview(async () => {
			await this.imageGenerator.updateCanvas();
		}, canvasContainer);

		// ---------- 导出事件 ----------
		this.addListener(downloadButton, 'click', () => {
			downloadButton.classList.add('clicked');
			setTimeout(() => downloadButton.classList.remove('clicked'), 600);

			const link = document.createElement('a');
			link.download = `${this.getFileName()}.${this.settings.format === 'jpeg' ? 'jpg' : 'png'}`;
			link.href = this.imageGenerator.getDataURL();
			link.click();

			showToast(true, t('toast.downloading'));
		});

		this.addListener(copyButton, 'click', async () => {
			copyButton.classList.add('clicked');
			setTimeout(() => copyButton.classList.remove('clicked'), 600);

			const success = await this.imageGenerator.copyToClipboard();
			showToast(success, success ? t('toast.copied') : t('toast.copyFailed'));
		});
	}

	/** Run a re-render with loading state, then swap in the fresh canvas. */
	private async refreshPreview(render: () => Promise<void>, canvasContainer: HTMLElement): Promise<void> {
		canvasContainer.addClass('is-loading');
		try {
			await render();
			canvasContainer.empty();
			canvasContainer.appendChild(this.imageGenerator.getCanvas());
		} finally {
			canvasContainer.removeClass('is-loading');
		}
	}

	private getFileName(): string {
		const activeFile = this.app.workspace.getActiveFile();
		return activeFile ? activeFile.basename : 'share-image';
	}

	onClose() {
		this.eventCleanups.forEach((cleanup) => cleanup());
		this.eventCleanups = [];

		this.contentEl.empty();

		if (this.imageGenerator) {
			// @ts-ignore - 直接置空内部画布引用以便垃圾回收
			this.imageGenerator.canvas = document.createElement('canvas');
		}
		// @ts-ignore - 便于垃圾回收
		this.imageGenerator = undefined;
	}
}
