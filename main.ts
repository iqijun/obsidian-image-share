import { App, Editor, Modal, Plugin, Menu, MarkdownRenderer, Component } from 'obsidian';
import './styles.css';
import html2canvas from 'html2canvas';


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
            const tempDiv = document.createElement('div');
            tempDiv.className = 'markdown-preview-view markdown-rendered';
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.width = `${this.currentTemplate.width}px`;
            tempDiv.style.background = this.currentTemplate.id === 'dark' ? '#2d3436' : '#f8f9fc';
            tempDiv.style.padding = '24px';
            tempDiv.style.boxSizing = 'border-box';
            tempDiv.style.wordBreak = 'break-word';
            // tempDiv.style.fontSize = '15px';
            // tempDiv.style.lineHeight = '1.5';
            // tempDiv.style.whiteSpace = 'pre-wrap';
            tempDiv.style.fontFamily = '"PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", "WenQuanYi Micro Hei", sans-serif';
            tempDiv.style.color = this.currentTemplate.id === 'dark' ? '#e2e2e2' : '#2c3e50';
            tempDiv.style.height = 'auto';

            // 添加日期
            const dateDiv = tempDiv.createDiv({ cls: 'metadata-container' });
            dateDiv.style.color = this.currentTemplate.id === 'dark' ? '#999999' : '#666666';
            dateDiv.style.fontSize = '13px';
            dateDiv.style.marginBottom = '20px';
            dateDiv.textContent = new Date().toLocaleDateString();

            // 添加内容容器
            const contentDiv = tempDiv.createDiv({ cls: 'markdown-preview-sizer' });
            
            // 渲染 Markdown
            await MarkdownRenderer.render(
                this.app,
                this.text,
                contentDiv,
                '',
                new Component()
            );

            // 应用优化的样式
            const styleSheet = document.createElement('style');
            styleSheet.textContent = `
                .markdown-here-wrapper {
                    font-size: 16px;
                    line-height: 1.8em;
                    letter-spacing: 0.1em;
                }
                
                
                pre, code {
                    font-size: 14px;
                    font-family: Roboto, 'Courier New', Consolas, Inconsolata, Courier, monospace;
                    margin: auto 5px;
                }
                
                code {
                    white-space: pre-wrap;
                    border-radius: 2px;
                    display: inline;
                }
                
                pre {
                    font-size: 15px;
                    line-height: 1.4em;
                    display: block; !important;
                }
                
                pre code {
                    white-space: pre;
                    overflow: auto;
                    border-radius: 3px;
                    padding: 1px 1px;
                    display: block !important;
                }
                
                strong, b{
                    color: #BF360C;
                }
                
                em, i {
                    color: #009688;
                }
                
                hr {
                    border: 1px solid #BF360C;
                    margin: 1.5em auto;
                }
                
                p {
                    margin: 1.5em 5px !important;
                }
                
                table, pre, dl, blockquote, q, ul, ol {
                    margin: 10px 5px;
                }
                
                ul, ol {
                    padding-left: 15px;
                }
                
                li {
                    margin: 10px;
                }
                
                li p {
                    margin: 10px 0 !important;
                }
                
                ul ul, ul ol, ol ul, ol ol {
                    margin: 0;
                    padding-left: 10px;
                }
                
                ul {
                    list-style-type: circle;
                }
                
                dl {
                    padding: 0;
                }
                
                dl dt {
                    font-size: 1em;
                    font-weight: bold;
                    font-style: italic;
                }
                
                dl dd {
                    margin: 0 0 10px;
                    padding: 0 10px;
                }
                
                blockquote, q {
                    border-left: 2px solid #009688;
                    padding: 0 10px;
                    color: #777;
                    quotes: none;
                    margin-left: 1em;
                }
                
                blockquote::before, blockquote::after, q::before, q::after {
                    content: none;
                }
                
                h1, h2, h3, h4, h5, h6 {
                    margin: 20px 0 10px;
                    padding: 0;
                    font-style: bold !important;
                    color: #009688 !important;
                    text-align: center !important;
                    margin: 1.5em 5px !important;
                    padding: 0.5em 1em !important;
                }
                
                h1 {
                    font-size: 24px !important;
                    border-bottom: 1px solid #ddd !important;
                }
                
                h2 {
                    font-size: 20px !important;
                    border-bottom: 1px solid #eee !important;
                }
                
                h3 {
                    font-size: 18px;
                }
                
                h4 {
                    font-size: 16px;
                }
                
                
                table {
                    padding: 0;
                    border-collapse: collapse;
                    border-spacing: 0;
                    font-size: 1em;
                    font: inherit;
                    border: 0;
                    margin: 0 auto;
                }
                
                tbody {
                    margin: 0;
                    padding: 0;
                    border: 0;
                }
                
                table tr {
                    border: 0;
                    border-top: 1px solid #CCC;
                    background-color: white;
                    margin: 0;
                    padding: 0;
                }
                
                table tr:nth-child(2n) {
                    background-color: #F8F8F8;
                }
                
                table tr th, table tr td {
                    font-size: 16px;
                    border: 1px solid #CCC;
                    margin: 0;
                    padding: 5px 10px;
                }
                
                table tr th {
                    font-weight: bold;
                    color: #eee;
                    border: 1px solid #009688;
                    background-color: #009688;
                }
            `;
            document.head.appendChild(styleSheet);
            document.body.appendChild(tempDiv);
            
            // 获取实际内容高度，包括内边距
            const actualHeight = tempDiv.scrollHeight;
            // 确保最小高度
            const minHeight = 200;
            const finalHeight = Math.max(actualHeight, minHeight);

            // 使用 html2canvas 渲染时使用计算出的高度
            const renderedCanvas = await html2canvas(tempDiv, {
                width: this.currentTemplate.width,
                height: finalHeight,
                backgroundColor: this.currentTemplate.id === 'dark' ? '#2d3436' : '#e8ecf9',
                scale: 2,
                windowWidth: this.currentTemplate.width,
                windowHeight: finalHeight,
                logging: true,
                useCORS: true,
                onclone: (clonedDoc) => {
                    const clonedDiv = clonedDoc.querySelector('.markdown-preview-view') as HTMLElement;
                    if (clonedDiv) {
                        clonedDiv.style.width = `${this.currentTemplate.width - 40}px`;
                        clonedDiv.style.height = `${finalHeight}px`;
                        clonedDiv.style.overflow = 'visible';
                    }
                }
            });

            // 更新画布
            this.canvas = renderedCanvas;

            // 清理临时元素
            document.body.removeChild(tempDiv);
            document.head.removeChild(styleSheet);
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

    constructor(app: App, text: string) {
        super(app);
        this.text = text;
        this.imageGenerator = new ImageGenerator(app, text);
    }

    async onOpen() {
        const {contentEl} = this;
        contentEl.empty();
        contentEl.addClass('image-share-modal');

        const resizableContainer = contentEl.createDiv({ cls: 'resizable-container' });
        const previewContainer = resizableContainer.createDiv({ cls: 'image-preview-container' });
        
        // 创建顶部操作区
        const headerDiv = previewContainer.createDiv({ cls: 'header' });
        headerDiv.createEl('h2', { text: '图片预览' });
        
        // 创建模板选择器
        const templateSelector = headerDiv.createDiv({ cls: 'template-selector' });

        // 创建画布容器
        const canvasContainer = previewContainer.createDiv({ cls: 'canvas-container' });

        // 创建模板选择器
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

        // 等待初始画布渲染完成
        await this.imageGenerator.updateCanvas();
        canvasContainer.appendChild(this.imageGenerator.getCanvas());

        // 添加下载按钮
        const downloadButton = contentEl.createEl('button', {
            cls: 'download-button',
            attr: {'title': '下载图片'}
        });
        downloadButton.innerHTML = `<svg viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 15.5a.74.74 0 0 1-.53-.22l-3-3A.75.75 0 0 1 9.53 11L12 13.44L14.47 11a.75.75 0 0 1 1.06 1.06l-3 3a.74.74 0 0 1-.53.22zm0-7.5a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-1.5 0v-6A.75.75 0 0 1 12 8z"/>
            <path fill="currentColor" d="M19.5 20.5h-15a.75.75 0 0 1 0-1.5h15a.75.75 0 0 1 0 1.5z"/>
        </svg>`;

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
    render: (ctx: CanvasRenderingContext2D, text: string) => Promise<void>;
}

// 预定义模板
const SHARE_TEMPLATES: ShareTemplate[] = [
    {
        id: 'default',
        name: '默认模板',
        width: 800,
        render: async () => {}
    },
    {
        id: 'dark',
        name: '深色模板',
        width: 800,
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