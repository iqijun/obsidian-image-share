import { App, Component, MarkdownRenderer } from 'obsidian';
import html2canvas from 'html2canvas';
import { SHARE_TEMPLATES, ShareTemplate } from './templates';
import { ImageShareSettings } from './settings';

/** Renders markdown text into a high-resolution canvas for export. */
export class ImageGenerator {
	private canvas: HTMLCanvasElement;
	private text: string;
	private currentTemplate: ShareTemplate;
	private currentStyle = 'default';
	private readonly app: App;
	private readonly settings: ImageShareSettings;

	constructor(app: App, text: string, settings: ImageShareSettings) {
		this.app = app;
		this.text = text;
		this.settings = settings;
		const initial =
			SHARE_TEMPLATES.find((tpl) => tpl.id === settings.defaultTheme) ?? SHARE_TEMPLATES[0];
		this.currentTemplate = initial;
		this.currentStyle = settings.defaultStyle;
		this.canvas = document.createElement('canvas');
	}

	public async updateCanvas(): Promise<HTMLCanvasElement> {
		try {
			const tempDiv = document.createElement('div');
			tempDiv.className = 'markdown-preview-view markdown-rendered temp-markdown-container temp-container';
			tempDiv.classList.add(this.currentTemplate.id === 'dark' ? 'dark-theme' : 'light-theme');
			tempDiv.classList.add('markdown-style-base');
			tempDiv.classList.add(`markdown-style-${this.currentStyle}`);
			tempDiv.classList.add(`template-width-${this.currentTemplate.width}`);
			tempDiv.classList.add('temp-div');

			// For non-standard widths, use a dynamic style element
			if (!document.querySelector(`.template-width-${this.currentTemplate.width}`)) {
				let styleElement = document.getElementById('template-dynamic-styles');
				if (!styleElement) {
					styleElement = document.createElement('style');
					styleElement.id = 'template-dynamic-styles';
					document.head.appendChild(styleElement);
				}
				styleElement.textContent += `
					.template-width-${this.currentTemplate.width} {
						width: ${this.currentTemplate.width}px;
					}
				`;
			}

			// 添加日期
			const dateDiv = tempDiv.createDiv({ cls: 'metadata-container temp-date-metadata' });
			dateDiv.classList.add(this.currentTemplate.id === 'dark' ? 'dark-theme' : 'light-theme');
			dateDiv.textContent = new Date().toLocaleDateString();

			// 添加内容容器
			const contentDiv = tempDiv.createDiv({ cls: 'markdown-preview-sizer' });

			// Create a component that we can unload later to prevent memory leaks
			const component = new Component();

			// 渲染 Markdown
			await MarkdownRenderer.render(
				this.app,
				this.text,
				contentDiv,
				'',
				component
			);

			document.body.appendChild(tempDiv);

			// 获取实际内容高度，包括内边距
			const actualHeight = tempDiv.scrollHeight;
			const minHeight = 200;
			const finalHeight = Math.max(actualHeight, minHeight);

			// 增加像素密度和图像质量
			const renderedCanvas = await html2canvas(tempDiv, {
				width: this.currentTemplate.width,
				height: finalHeight,
				backgroundColor: this.currentTemplate.id === 'dark' ? '#1f2430' : '#fafbfd',
				scale: window.devicePixelRatio * 2,
				windowWidth: this.currentTemplate.width,
				windowHeight: finalHeight,
				logging: false,
				useCORS: true,
				imageTimeout: 0,
				allowTaint: true,
				onclone: (clonedDoc) => {
					const clonedDiv = clonedDoc.querySelector('.markdown-preview-view') as HTMLElement;
					if (clonedDiv) {
						clonedDiv.classList.add('cloned-preview-container');
						clonedDiv.classList.add(`template-width-${this.currentTemplate.width - 40}`);

						if (!clonedDoc.querySelector(`.content-height-${finalHeight}`)) {
							const styleElement = clonedDoc.createElement('style');
							styleElement.textContent = `
								.content-height-${finalHeight} {
									height: ${finalHeight}px;
								}
							`;
							clonedDoc.head.appendChild(styleElement);
						}

						clonedDiv.classList.add(`content-height-${finalHeight}`);
						clonedDiv.classList.add('dynamic-height');
						clonedDiv.classList.add('enhanced-text-rendering');

						clonedDiv.classList.add('markdown-style-base');
						clonedDiv.classList.add(`markdown-style-${this.currentStyle}`);
					}
				}
			});

			this.canvas = renderedCanvas;

			// 清理临时元素与组件，防止内存泄漏
			tempDiv.remove();
			component.unload();
		} catch (error) {
			console.error('Error rendering markdown:', error);
		}

		return this.canvas;
	}

	public async setStyle(style: string): Promise<void> {
		this.currentStyle = style;
		await this.updateCanvas();
	}

	public getCurrentStyle(): string {
		return this.currentStyle;
	}

	public getCanvas(): HTMLCanvasElement {
		return this.canvas;
	}

	public getDataURL(): string {
		if (this.settings.format === 'jpeg') {
			return this.canvas.toDataURL('image/jpeg', this.settings.quality);
		}
		return this.canvas.toDataURL('image/png');
	}

	public getMimeType(): string {
		return this.settings.format === 'jpeg' ? 'image/jpeg' : 'image/png';
	}

	public async copyToClipboard(): Promise<boolean> {
		try {
			// 统一以 PNG 写入剪贴板，兼容性最好
			const blob = await new Promise<Blob>((resolve, reject) => {
				this.canvas.toBlob((b) => {
					if (b) {
						resolve(b);
					} else {
						reject(new Error('Failed to create blob from canvas'));
					}
				}, 'image/png', 1.0);
			});

			const data = [new ClipboardItem({ 'image/png': blob })];
			await navigator.clipboard.write(data);
			return true;
		} catch (error) {
			console.error('复制到剪贴板失败:', error);
			return false;
		}
	}

	public async setTemplate(templateId: string): Promise<void> {
		const template = SHARE_TEMPLATES.find((tpl) => tpl.id === templateId);
		if (template) {
			this.currentTemplate = template;
			await this.updateCanvas();
		}
	}

	public getCurrentTemplate(): ShareTemplate {
		return this.currentTemplate;
	}
}
