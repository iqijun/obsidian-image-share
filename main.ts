import { App, Editor, Modal, Plugin, Menu, MarkdownRenderer, Component } from 'obsidian';
import './styles.css';
import html2canvas from 'html2canvas';

// Remember to rename these classes and interfaces!

// interface MyPluginSettings {
// 	mySetting: string;
// }

// const DEFAULT_SETTINGS: MyPluginSettings = {
// 	mySetting: 'default'
// }

// export default class MyPlugin extends Plugin {
// 	settings: MyPluginSettings;

// 	async onload() {
// 		await this.loadSettings();

// 		// This creates an icon in the left ribbon.
// 		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
// 			// Called when the user clicks the icon.
// 			new Notice('hello world!');
// 		});
// 		// Perform additional things with the ribbon
// 		ribbonIconEl.addClass('my-plugin-ribbon-class');

// 		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
// 		const statusBarItemEl = this.addStatusBarItem();
// 		statusBarItemEl.setText('Status Bar Text');

// 		// This adds a simple command that can be triggered anywhere
// 		this.addCommand({
// 			id: 'open-sample-modal-simple',
// 			name: 'Open sample modal (simple)',
// 			callback: () => {
// 				new SampleModal(this.app).open();
// 			}
// 		});
// 		// This adds an editor command that can perform some operation on the current editor instance
// 		this.addCommand({
// 			id: 'sample-editor-command',
// 			name: 'Sample editor command',
// 			editorCallback: (editor: Editor, view: MarkdownView) => {
// 				console.log(editor.getSelection());
// 				editor.replaceSelection('Sample Editor Command');
// 			}
// 		});
// 		// This adds a complex command that can check whether the current state of the app allows execution of the command
// 		this.addCommand({
// 			id: 'open-sample-modal-complex',
// 			name: 'Open sample modal (complex)',
// 			checkCallback: (checking: boolean) => {
// 				// Conditions to check
// 				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
// 				if (markdownView) {
// 					// If checking is true, we're simply "checking" if the command can be run.
// 					// If checking is false, then we want to actually perform the operation.
// 					if (!checking) {
// 						new SampleModal(this.app).open();
// 					}

// 					// This command will only show up in Command Palette when the check function returns true
// 					return true;
// 				}
// 			}
// 		});

// 		// This adds a settings tab so the user can configure various aspects of the plugin
// 		this.addSettingTab(new SampleSettingTab(this.app, this));

// 		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
// 		// Using this function will automatically remove the event listener when this plugin is disabled.
// 		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
// 			console.log('click', evt);
// 		});

// 		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
// 		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
// 	}

// 	onunload() {

// 	}

// 	async loadSettings() {
// 		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
// 	}

// 	async saveSettings() {
// 		await this.saveData(this.settings);
// 	}
// }

// class SampleModal extends Modal {
// 	constructor(app: App) {
// 		super(app);
// 	}

// 	onOpen() {
// 		const {contentEl} = this;
// 		contentEl.setText('Woah!');
// 	}

// 	onClose() {
// 		const {contentEl} = this;
// 		contentEl.empty();
// 	}
// }

// class SampleSettingTab extends PluginSettingTab {
// 	plugin: MyPlugin;

// 	constructor(app: App, plugin: MyPlugin) {
// 		super(app, plugin);
// 		this.plugin = plugin;
// 	}

// 	display(): void {
// 		const {containerEl} = this;

// 		containerEl.empty();

// 		new Setting(containerEl)
// 			.setName('Setting #1')
// 			.setDesc('It\'s a secret')
// 			.addText(text => text
// 				.setPlaceholder('Enter your secret')
// 				.setValue(this.plugin.settings.mySetting)
// 				.onChange(async (value) => {
// 					this.plugin.settings.mySetting = value;
// 					await this.plugin.saveSettings();
// 				}));
// 	}
// }

// 图片生成器类
class ImageGenerator {
    private canvas: HTMLCanvasElement;
    private text: string;
    private currentTemplate: ShareTemplate;
    private app: App;

    constructor(app: App, text: string) {
        this.app = app;
        this.text = text;
        this.currentTemplate = SHARE_TEMPLATES[0];
        this.canvas = document.createElement('canvas');
    }

    public async updateCanvas() {
        try {
            // 创建临时容器
            const tempDiv = document.createElement('div');
            tempDiv.className = 'markdown-preview-view';
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.width = `${this.currentTemplate.width - 40}px`;
            tempDiv.style.background = this.currentTemplate.id === 'dark' ? '#2d3436' : '#e8ecf9';
            tempDiv.style.padding = '20px';
            tempDiv.style.boxSizing = 'border-box';
            tempDiv.style.wordBreak = 'break-word';
            tempDiv.style.fontSize = '14px';
            tempDiv.style.lineHeight = '1.5';
            tempDiv.style.whiteSpace = 'pre-wrap';  // 保留换行和空格

            // 添加日期
            const dateDiv = tempDiv.createDiv();
            dateDiv.style.color = this.currentTemplate.id === 'dark' ? '#999999' : '#666666';
            dateDiv.style.fontSize = '14px';
            dateDiv.style.marginBottom = '16px';
            dateDiv.textContent = new Date().toLocaleDateString();

            // 添加内容容器
            const contentDiv = tempDiv.createDiv();
            contentDiv.style.color = this.currentTemplate.id === 'dark' ? '#ffffff' : '#333333';
            
            // 渲染 Markdown
            await MarkdownRenderer.render(
                this.app,
                this.text,
                contentDiv,
                '',
                new Component()
            );

            document.body.appendChild(tempDiv);

            // 获取实际内容高度并添加一些内边距
            const actualHeight = tempDiv.offsetHeight + 40;
            const minHeight = 300;
            const maxHeight = 20000;  // 增加最大高度限制
            const finalHeight =2000;// Math.min(Math.max(actualHeight, minHeight), maxHeight);

            // 使用 html2canvas 渲染
            const renderedCanvas = await html2canvas(tempDiv, {
                width: this.currentTemplate.width,
                height: finalHeight,
                backgroundColor: this.currentTemplate.id === 'dark' ? '#2d3436' : '#e8ecf9',
                scale: 2,
                windowWidth: this.currentTemplate.width,
                windowHeight: finalHeight,
                logging: false,
                useCORS: true,
                onclone: (clonedDoc) => {
                    const clonedDiv = clonedDoc.querySelector('.markdown-preview-view') as HTMLElement;
                    if (clonedDiv) {
                        clonedDiv.style.width = `${this.currentTemplate.width - 40}px`;
                        clonedDiv.style.height = `${finalHeight}px`;
                        clonedDiv.style.overflow = 'visible';  // 改为 visible
                    }
                }
            });

            // 更新画布
            this.canvas = renderedCanvas;

            // 清理临时元素
            document.body.removeChild(tempDiv);
        } catch (error) {
            console.error('Error rendering markdown:', error);
        }
    }

    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    public getDataURL(): string {
        return this.canvas.toDataURL('image/png');
    }

    public async setTemplate(templateId: string) {
        const template = SHARE_TEMPLATES.find(t => t.id === templateId);
        if (template) {
            this.currentTemplate = template;
            await this.updateCanvas();
        }
    }
}

class TextPreviewModal extends Modal {
    private text: string;
    private imageGenerator: ImageGenerator;
    private isResizing: boolean = false;
    private startX: number = 0;
    private startY: number = 0;
    private startWidth: number = 0;
    private startHeight: number = 0;

    constructor(app: App, text: string) {
        super(app);
        this.text = text;
        this.imageGenerator = new ImageGenerator(app, text);
    }

    async onOpen() {
        const {contentEl} = this;
        contentEl.empty();
        contentEl.addClass('image-share-modal');

        // 创建可调整大小的容器
        const resizableContainer = contentEl.createDiv({ cls: 'resizable-container' });
        
        const previewContainer = resizableContainer.createDiv({ cls: 'image-preview-container' });
        previewContainer.createEl('h2', { text: '图片预览' });

        const templateSelector = previewContainer.createDiv({ cls: 'template-selector' });
        const canvasContainer = previewContainer.createDiv({ cls: 'canvas-container' });

        // 添加调整大小的手柄
        const resizeHandle = resizableContainer.createDiv({ cls: 'resize-handle' });

        // 处理拖拽调整大小
        const handleMouseDown = (e: MouseEvent) => {
            this.isResizing = true;
            this.startX = e.clientX;
            this.startY = e.clientY;
            this.startWidth = resizableContainer.offsetWidth;
            this.startHeight = resizableContainer.offsetHeight;

            // 添加临时事件监听器
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'se-resize';
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!this.isResizing) return;

            const width = this.startWidth + (e.clientX - this.startX);
            const height = this.startHeight + (e.clientY - this.startY);

            // 设置最小尺寸
            const minWidth = 400;
            const minHeight = 300;

            resizableContainer.style.width = `${Math.max(width, minWidth)}px`;
            resizableContainer.style.height = `${Math.max(height, minHeight)}px`;
        };

        const handleMouseUp = () => {
            this.isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };

        resizeHandle.addEventListener('mousedown', handleMouseDown);

        // 等待初始画布渲染完成
        await this.imageGenerator.updateCanvas();
        canvasContainer.appendChild(this.imageGenerator.getCanvas());

        SHARE_TEMPLATES.forEach(template => {
            const templateButton = templateSelector.createEl('button', {
                cls: 'template-button',
                text: template.name
            });
            templateButton.onclick = async () => {
                templateSelector.findAll('.template-button').forEach(btn => 
                    btn.removeClass('active')
                );
                templateButton.addClass('active');
                await this.imageGenerator.setTemplate(template.id);
                canvasContainer.empty();
                canvasContainer.appendChild(this.imageGenerator.getCanvas());
            };
            if (template.id === 'default') {
                templateButton.addClass('active');
            }
        });

        // 添加下载按钮
        const downloadButton = previewContainer.createEl('button', {
            cls: 'download-button'
        });
        
        // 添加下载图标
        downloadButton.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M12 15.5a.74.74 0 0 1-.53-.22l-3-3A.75.75 0 0 1 9.53 11L12 13.44L14.47 11a.75.75 0 0 1 1.06 1.06l-3 3a.74.74 0 0 1-.53.22zm0-7.5a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-1.5 0v-6A.75.75 0 0 1 12 8z"/>
            <path fill="currentColor" d="M19.5 20.5h-15a.75.75 0 0 1 0-1.5h15a.75.75 0 0 1 0 1.5z"/>
        </svg>`;

        // 添加提示文本
        downloadButton.setAttribute('title', '下载图片');

        downloadButton.onclick = () => {
            const link = document.createElement('a');
            link.download = 'share-image.png';
            link.href = this.imageGenerator.getDataURL();
            link.click();
        };
    }

    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}

// 模板接口定义
interface ShareTemplate {
    id: string;
    name: string;
    width: number;
    height: number;
    render: (ctx: CanvasRenderingContext2D, text: string) => Promise<void>;
}

// 预定义模板
const SHARE_TEMPLATES: ShareTemplate[] = [
    {
        id: 'default',
        name: '默认模板',
        width: 600,  // 进一步增加宽度
        height: 300,
        render: async () => {}
    },
    {
        id: 'dark',
        name: '深色模板',
        width: 600,  // 进一步增加宽度
        height: 300,
        render: async () => {}
    }
];

export default class ImageSharePlugin extends Plugin {
    async onload() {
        // 注册编辑器右键菜单
        this.registerEvent(
            this.app.workspace.on('editor-menu', (menu: Menu, editor: Editor) => {
                const selectedText = editor.getSelection();
                
                if (selectedText) {
                    menu.addItem((item) => {
                        item
                            .setTitle('Share as Image')
                            .setIcon('image')
                            .onClick(async () => {
                                new TextPreviewModal(this.app, selectedText).open();
                            });
                    });
                }
            })
        );

        // 添加命令到命令面板
        this.addCommand({
            id: 'share-as-image',
            name: 'Share selected text as image',
            editorCallback: (editor: Editor) => {
                const selectedText = editor.getSelection();
                if (selectedText) {
                    new TextPreviewModal(this.app, selectedText).open();
                }
            }
        });
    }

    onunload() {
        // 插件卸载时的清理代码
    }
} 