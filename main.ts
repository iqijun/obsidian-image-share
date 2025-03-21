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
            // 添加文本换行处理，确保内容不会溢出
            tempDiv.style.overflowWrap = 'break-word';
            tempDiv.style.wordWrap = 'break-word';
            tempDiv.style.hyphens = 'auto';
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
                    line-height: 2.0em; /* 增加行高 */
                    letter-spacing: 0.12em; /* 增加字间距 */
                }
                
                /* 增加段落间距和内边距 */
                p {
                    margin: 1.8em 5px !important;
                    padding: 0.2em 0;
                }
                
                /* 优化列表项间距 */
                li {
                    margin: 12px 0;
                    line-height: 1.8em;
                }
                
                /* 改善标题样式 */
                h1, h2, h3, h4, h5, h6 {
                    margin: 28px 0 18px !important;
                    padding: 0.6em 1em !important;
                    line-height: 1.5em;
                }
                
                /* 优化引用块样式 */
                blockquote, q {
                    padding: 10px 15px;
                    margin: 15px 0;
                    line-height: 1.8em;
                }
                
                /* 列表项内容间距 */
                ul, ol {
                    padding-left: 25px;
                    margin: 15px 5px;
                }
                
                /* 确保代码块不会挤压 */
                pre {
                    margin: 15px 0;
                    padding: 12px;
                    line-height: 1.5em;
                }
                
                /* 添加内容容器的整体间距 */
                .markdown-preview-sizer {
                    padding: 10px 5px;
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

            // 增加像素密度和图像质量
            const renderedCanvas = await html2canvas(tempDiv, {
                width: this.currentTemplate.width,
                height: finalHeight,
                backgroundColor: this.currentTemplate.id === 'dark' ? '#2d3436' : '#e8ecf9',
                scale: window.devicePixelRatio * 2, // 根据设备像素比自动调整清晰度
                windowWidth: this.currentTemplate.width,
                windowHeight: finalHeight,
                logging: false, // 减少日志输出
                useCORS: true,
                imageTimeout: 0, // 防止图像加载超时
                allowTaint: true, // 允许跨域图像
                onclone: (clonedDoc) => {
                    const clonedDiv = clonedDoc.querySelector('.markdown-preview-view') as HTMLElement;
                    if (clonedDiv) {
                        clonedDiv.style.width = `${this.currentTemplate.width - 40}px`;
                        clonedDiv.style.height = `${finalHeight}px`;
                        clonedDiv.style.overflow = 'visible';
                        // 增加文本渲染清晰度
                        clonedDiv.style.textRendering = 'optimizeLegibility';
                        clonedDiv.style['webkitFontSmoothing' as any] = 'antialiased';
                        clonedDiv.style['mozOsxFontSmoothing' as any] = 'grayscale';
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
        // 增加输出质量，使用PNG格式以保持最佳质量
        return this.canvas.toDataURL('image/png', 1.0);
    }
    
    public async downloadAsImage() {
          // 获取当前活动文件的名称
          const activeFile = this.app.workspace.getActiveFile();
          const fileName = activeFile ? activeFile.basename : 'share-image';
          
        const dataURL = this.getDataURL();
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = `${fileName}.png`;
        a.click();
    }
    
    public async copyToClipboard(): Promise<boolean> {
        try {
            // 创建一个临时的canvas元素以获取Blob对象
            const canvas = this.canvas;
            
            // 将canvas转换为blob对象
            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((b) => {
                    if (b) {
                        resolve(b);
                    } else {
                        reject(new Error('Failed to create blob from canvas'));
                    }
                }, 'image/png', 1.0);
            });
            
            // 创建ClipboardItem对象
            const data = [new ClipboardItem({ 'image/png': blob })];
            
            // 写入剪贴板
            await navigator.clipboard.write(data);
            return true;
        } catch (error) {
            console.error('复制到剪贴板失败:', error);
            return false;
        }
    }
    
    public async setTemplate(templateId: string) {
        const template = SHARE_TEMPLATES.find(t => t.id === templateId);
        if (template) {
            this.currentTemplate = template;
            await this.updateCanvas();
        }
    }
    
    // 添加获取当前模板的方法
    public getCurrentTemplate(): ShareTemplate {
        return this.currentTemplate;
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

        // 获取屏幕大小
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // 创建一个调整模态框大小的函数
        const adjustModalSize = (width: number, height: number, padding = 80) => {
            // 计算内容尺寸（加上内边距和左侧控制面板的宽度）
            const contentWidth = width + padding + 280; // 280px是左侧控制面板的宽度
            const contentHeight = height + padding; 
            
            // 应用适当的限制
            const maxWidth = Math.min(windowWidth * 0.9, 2000); // 最大宽度为窗口的90%或2000px
            const maxHeight = Math.min(windowHeight * 0.9, 2000); // 最大高度为窗口的90%或2000px
            
            // 确保尺寸在合理范围内
            const finalWidth = Math.min(Math.max(contentWidth, 800), maxWidth);
            const finalHeight = Math.min(Math.max(contentHeight, 600), maxHeight);
            
            // 应用到模态框和父模态框
            const modalElement = contentEl.parentElement as HTMLElement;
            if (modalElement && modalElement.classList.contains('modal')) {
                modalElement.style.width = `${finalWidth}px`;
                modalElement.style.height = `${finalHeight}px`;
                // 确保模态框的高度是100%，让内容可以在各自区域内滚动
                modalElement.style.display = 'flex';
                modalElement.style.flexDirection = 'column';
            }
            
            // 也应用到当前元素以保持一致性
            contentEl.style.width = `${finalWidth}px`;
            contentEl.style.height = `100%`;
            contentEl.style.display = 'flex';
            contentEl.style.flexDirection = 'column';
        };
        
        // 计算合适的初始模态框大小
        const currentTemplate = this.imageGenerator.getCurrentTemplate();
        // 初始设置 - 将在渲染完成后更新
        adjustModalSize(currentTemplate.width, 600);

        const resizableContainer = contentEl.createDiv({ cls: 'resizable-container' });
        
        // 创建左侧控制面板
        const controlsPanel = resizableContainer.createDiv({ cls: 'controls-panel' });
        
        // 创建控制面板标题
        controlsPanel.createEl('h2', { text: '图片设置' });
        
        // 1. 创建主题选择区域
        const themeSection = controlsPanel.createDiv({ cls: 'control-section' });
        themeSection.createEl('div', { text: '选择主题', cls: 'section-title' });
        
        // 创建模板选择器
        const templateSelector = themeSection.createDiv({ cls: 'template-selector' });
        
        // 2. 创建缩放控制区域
        const zoomSection = controlsPanel.createDiv({ cls: 'control-section' });
        zoomSection.createEl('div', { text: '调整大小', cls: 'section-title' });
        
        // 创建缩放控制
        const zoomControls = zoomSection.createDiv({ cls: 'zoom-controls' });
        
        const zoomOutBtn = zoomControls.createEl('button', {
            cls: 'zoom-button zoom-out',
            attr: { 'aria-label': '缩小预览' }
        });
        zoomOutBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>';

        const zoomText = zoomControls.createEl('span', {
            cls: 'zoom-text',
            text: '100%'
        });

        const zoomInBtn = zoomControls.createEl('button', {
            cls: 'zoom-button zoom-in',
            attr: { 'aria-label': '放大预览' }
        });
        zoomInBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>';

        // 创建空间填充区域
        controlsPanel.createDiv({ cls: 'flex-spacer' });

        // 3. 创建下载按钮区域 - 总是在底部
        const downloadSection = controlsPanel.createDiv({ cls: 'control-section download-section' });
        downloadSection.createEl('div', { text: '导出图片', cls: 'section-title' });
        
        // 修改容器类名为垂直布局
        const buttonsContainer = downloadSection.createDiv({ cls: 'buttons-container vertical' });
        
        // 创建下载按钮 - 放在前面
        const downloadButton = buttonsContainer.createEl('button', {
            cls: 'elegant-button download-button',
            attr: { 'aria-label': '下载图片' }
        });

        // 使用更现代的SVG图标并添加文本
        downloadButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>下载图片</span>
        `;

        // 创建复制按钮 - 放在下载按钮后面
        const copyButton = buttonsContainer.createEl('button', {
            cls: 'elegant-button copy-button',
            attr: { 'aria-label': '复制到剪贴板' }
        });

        // 使用更现代的SVG图标并添加文本
        copyButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>复制图片</span>
        `;
        
        // 创建右侧预览面板
        const previewPanel = resizableContainer.createDiv({ cls: 'preview-panel' });
        
        // 创建预览面板标题
        previewPanel.createEl('h2', { text: '图片预览' });
        
        // 创建画布容器
        const canvasContainer = previewPanel.createDiv({ cls: 'canvas-container' });
        
        // 创建模板选择器
        SHARE_TEMPLATES.forEach(template => {
            const templateButton = templateSelector.createEl('button', {
                cls: 'template-button',
                text: template.name
            });
            
            // 添加图标到模板按钮
            if (template.id === 'default') {
                templateButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg> ${template.name}`;
            } else if (template.id === 'dark') {
                templateButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> ${template.name}`;
            }
            
            templateButton.onclick = async () => {
                templateSelector.findAll('.template-button').forEach(btn => 
                    btn.removeClass('active')
                );
                templateButton.addClass('active');
                
                // 添加点击反馈动画
                templateButton.animate([
                    { transform: 'scale(0.95)' },
                    { transform: 'scale(1)' }
                ], {
                    duration: 150,
                    easing: 'ease-out'
                });
                
                await this.imageGenerator.setTemplate(template.id);
                canvasContainer.empty();
                const newCanvas = this.imageGenerator.getCanvas();
                canvasContainer.appendChild(newCanvas);
                
                // 当模板变更时更新弹出框尺寸
                adjustModalSize(newCanvas.width, newCanvas.height);
                
                // 始终使用100%缩放
                updateZoom(100);
            };
            if (template.id === 'default') {
                templateButton.addClass('active');
            }
        });
        
        // 缩放逻辑
        const updateZoom = (level: number) => {
            const canvas = canvasContainer.querySelector('canvas');
            if (canvas) {
                // 设置实际宽度值而不是百分比，确保缩放效果生效
                const originalWidth = canvas.width;
                canvas.style.width = `${originalWidth * level / 100}px`;
                canvas.style.maxWidth = 'none'; // 移除最大宽度限制以允许放大
                zoomText.textContent = `${level}%`;
            }
        };
        
        // 等待初始画布渲染完成
        await this.imageGenerator.updateCanvas();
        const canvas = this.imageGenerator.getCanvas();
        canvasContainer.appendChild(canvas);
        
        // 更新模态框大小以适应画布
        adjustModalSize(canvas.width, canvas.height);

        // 设置默认缩放比例为100%
        let zoomLevel = 100;
        updateZoom(zoomLevel);

        // 添加缩放按钮事件和动画
        zoomOutBtn.addEventListener('click', () => {
            if (zoomLevel > 50) {
                zoomLevel -= 10;
                updateZoom(zoomLevel);
                
                // 添加点击动画
                zoomOutBtn.animate([
                    { transform: 'scale(0.9)' },
                    { transform: 'scale(1)' }
                ], {
                    duration: 150,
                    easing: 'ease-out'
                });
            }
        });

        zoomInBtn.addEventListener('click', () => {
            if (zoomLevel < 200) {
                zoomLevel += 10;
                updateZoom(zoomLevel);
                
                // 添加点击动画
                zoomInBtn.animate([
                    { transform: 'scale(0.9)' },
                    { transform: 'scale(1)' }
                ], {
                    duration: 150,
                    easing: 'ease-out'
                });
            }
        });

        // 添加复制按钮点击事件
        copyButton.addEventListener('click', async () => {
            copyButton.classList.add('clicked');
            
            const success = await this.imageGenerator.copyToClipboard();
            
            const toast = document.createElement('div');
            toast.className = 'download-toast';
            toast.innerHTML = success 
                ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                   <span>已复制到剪贴板</span>`
                : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff5555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                   <span>复制失败</span>`;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                copyButton.classList.remove('clicked');
            }, 150);
            
            setTimeout(() => {
                toast.classList.add('hide');
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            }, 2000);
        });
        
        // 添加下载按钮点击事件
        downloadButton.addEventListener('click', () => {
            downloadButton.classList.add('clicked');
            
            // 生成下载
            const link = document.createElement('a');
            link.download = `Obsidian-${new Date().toISOString().replace(/:/g, '-')}.png`;
            link.href = this.imageGenerator.getDataURL();
            link.click();
            
            const toast = document.createElement('div');
            toast.className = 'download-toast';
            toast.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>已开始下载</span>
            `;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                downloadButton.classList.remove('clicked');
            }, 150);
            
            setTimeout(() => {
                toast.classList.add('hide');
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            }, 2000);
        });
        
        this.contentEl.addClass('text-preview-modal');
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