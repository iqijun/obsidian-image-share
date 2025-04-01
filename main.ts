import { App, Editor, Modal, Plugin, Menu, MarkdownRenderer, Component } from 'obsidian';
import './styles.css';
import html2canvas from 'html2canvas';


// 图片生成器类
class ImageGenerator {
    private canvas: HTMLCanvasElement;
    private text: string;
    private currentTemplate: ShareTemplate;
    private currentStyle = 'default'; // Removed type annotation
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
            tempDiv.className = 'markdown-preview-view markdown-rendered temp-markdown-container temp-container';
            tempDiv.classList.add(this.currentTemplate.id === 'dark' ? 'dark-theme' : 'light-theme');
            // Add the markdown style classes
            tempDiv.classList.add('markdown-style-base');
            tempDiv.classList.add(`markdown-style-${this.currentStyle}`);
            
            // Set template width via CSS custom property
            tempDiv.style.setProperty('--template-width', `${this.currentTemplate.width}px`);
            tempDiv.classList.add('temp-div');

            // 添加日期
            const dateDiv = tempDiv.createDiv({ cls: 'metadata-container temp-date-metadata' });
            dateDiv.classList.add(this.currentTemplate.id === 'dark' ? 'dark-theme' : 'light-theme');
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
                        // Set width and height via CSS classes and custom properties
                        clonedDiv.classList.add('cloned-preview-container');
                        clonedDiv.classList.add(`template-width-${this.currentTemplate.width - 40}`);
                        clonedDiv.style.setProperty('--content-height', `${finalHeight}px`);
                        clonedDiv.classList.add('dynamic-height');
                        clonedDiv.classList.add('enhanced-text-rendering');
                        
                        // 确保所有样式类都被正确应用
                        clonedDiv.classList.remove('markdown-style-default', 'markdown-style-modern', 'markdown-style-minimal');
                        
                        // 添加基础样式类
                        if (!clonedDiv.classList.contains('markdown-style-base')) {
                            clonedDiv.classList.add('markdown-style-base');
                        }
                        
                        // 添加当前选择的样式类
                        const styleClass = `markdown-style-${this.currentStyle}`;
                        clonedDiv.classList.add(styleClass);
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

    // Add a method to set the style
    public async setStyle(style: string) {
        if (this.currentStyle !== style) {
            this.currentStyle = style;
            await this.updateCanvas();
        }
    }

    // Add a method to get the current style
    public getCurrentStyle(): string {
        return this.currentStyle;
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
        // We no longer need these variables
        // const windowWidth = window.innerWidth;
        // const windowHeight = window.innerHeight;
        
        // 创建一个调整模态框大小的函数
        function adjustModalSize(width: number, height: number) {
            const modalElement = contentEl.closest('.modal') as HTMLElement;
            if (!modalElement) return;
            
            // 计算最终宽高，考虑屏幕尺寸限制
            const maxWidth = window.innerWidth * 0.9;
            const maxHeight = window.innerHeight * 0.9;
            const finalWidth = Math.min(width + 300, maxWidth); // 300px 是左侧面板宽度
            const finalHeight = Math.min(height + 80, maxHeight); // 添加额外的高度用于顶部和底部
            
            // Use CSS custom properties for dynamic sizing
            modalElement.style.setProperty('--modal-width', `${finalWidth}px`);
            modalElement.style.setProperty('--modal-height', `${finalHeight}px`);
            modalElement.classList.add('modal-size');
            
            // 添加flex布局
            modalElement.classList.add('modal-layout');
            
            // 调整内容区域
            contentEl.classList.add('modal-content-layout');
        }
        
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
            attr: { 'aria-label': '下载分享图片' }
        });
        
        const downloadIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        downloadIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        downloadIcon.setAttribute('width', '18');
        downloadIcon.setAttribute('height', '18');
        downloadIcon.setAttribute('viewBox', '0 0 24 24');
        downloadIcon.setAttribute('fill', 'none');
        downloadIcon.setAttribute('stroke', 'currentColor');
        downloadIcon.setAttribute('stroke-width', '2');
        downloadIcon.setAttribute('stroke-linecap', 'round');
        downloadIcon.setAttribute('stroke-linejoin', 'round');
        downloadIcon.classList.add('download-icon');
        
        const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path1.setAttribute('d', 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4');
        
        const line6 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line6.setAttribute('x1', '7');
        line6.setAttribute('y1', '10');
        line6.setAttribute('x2', '12');
        line6.setAttribute('y2', '15');
        
        const line7 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line7.setAttribute('x1', '17');
        line7.setAttribute('y1', '10');
        line7.setAttribute('x2', '12');
        line7.setAttribute('y2', '15');
        
        const line8 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line8.setAttribute('x1', '12');
        line8.setAttribute('y1', '15');
        line8.setAttribute('x2', '12');
        line8.setAttribute('y2', '3');
        
        downloadIcon.appendChild(path1);
        downloadIcon.appendChild(line6);
        downloadIcon.appendChild(line7);
        downloadIcon.appendChild(line8);
        
        downloadButton.appendChild(downloadIcon);
        
        const downloadText = document.createElement('span');
        downloadText.textContent = '下载图片';
        downloadButton.appendChild(downloadText);

        // 创建复制按钮 - 放在下载按钮后面
        const copyButton = buttonsContainer.createEl('button', {
            cls: 'elegant-button copy-button',
            attr: { 'aria-label': '复制图片到剪贴板' }
        });
        
        const copyIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        copyIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        copyIcon.setAttribute('width', '18');
        copyIcon.setAttribute('height', '18');
        copyIcon.setAttribute('viewBox', '0 0 24 24');
        copyIcon.setAttribute('fill', 'none');
        copyIcon.setAttribute('stroke', 'currentColor');
        copyIcon.setAttribute('stroke-width', '2');
        copyIcon.setAttribute('stroke-linecap', 'round');
        copyIcon.setAttribute('stroke-linejoin', 'round');
        copyIcon.classList.add('copy-icon');
        
        const rect1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect1.setAttribute('x', '9');
        rect1.setAttribute('y', '9');
        rect1.setAttribute('width', '13');
        rect1.setAttribute('height', '13');
        rect1.setAttribute('rx', '2');
        rect1.setAttribute('ry', '2');
        
        const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path2.setAttribute('d', 'M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1');
        
        copyIcon.appendChild(rect1);
        copyIcon.appendChild(path2);
        
        copyButton.appendChild(copyIcon);
        
        const copyText = document.createElement('span');
        copyText.textContent = '复制到剪贴板';
        copyButton.appendChild(copyText);
        
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
            if (template.id === 'light') {
                const lightIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                lightIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                lightIcon.setAttribute('width', '16');
                lightIcon.setAttribute('height', '16');
                lightIcon.setAttribute('viewBox', '0 0 24 24');
                lightIcon.setAttribute('fill', 'none');
                lightIcon.setAttribute('stroke', 'currentColor');
                lightIcon.setAttribute('stroke-width', '2');
                lightIcon.setAttribute('stroke-linecap', 'round');
                lightIcon.setAttribute('stroke-linejoin', 'round');
                lightIcon.classList.add('light-template-icon');
                
                const circle2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle2.setAttribute('cx', '12');
                circle2.setAttribute('cy', '12');
                circle2.setAttribute('r', '5');
                
                const line9 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line9.setAttribute('x1', '12');
                line9.setAttribute('y1', '1');
                line9.setAttribute('x2', '12');
                line9.setAttribute('y2', '3');
                
                const line10 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line10.setAttribute('x1', '12');
                line10.setAttribute('y1', '21');
                line10.setAttribute('x2', '12');
                line10.setAttribute('y2', '23');
                
                const line11 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line11.setAttribute('x1', '4.22');
                line11.setAttribute('y1', '4.22');
                line11.setAttribute('x2', '5.64');
                line11.setAttribute('y2', '5.64');
                
                const line12 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line12.setAttribute('x1', '18.36');
                line12.setAttribute('y1', '18.36');
                line12.setAttribute('x2', '19.78');
                line12.setAttribute('y2', '19.78');
                
                const line13 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line13.setAttribute('x1', '1');
                line13.setAttribute('y1', '12');
                line13.setAttribute('x2', '3');
                line13.setAttribute('y2', '12');
                
                const line14 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line14.setAttribute('x1', '21');
                line14.setAttribute('y1', '12');
                line14.setAttribute('x2', '23');
                line14.setAttribute('y2', '12');
                
                const line15 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line15.setAttribute('x1', '4.22');
                line15.setAttribute('y1', '19.78');
                line15.setAttribute('x2', '5.64');
                line15.setAttribute('y2', '18.36');
                
                const line16 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line16.setAttribute('x1', '18.36');
                line16.setAttribute('y1', '5.64');
                line16.setAttribute('x2', '19.78');
                line16.setAttribute('y2', '4.22');
                
                lightIcon.appendChild(circle2);
                lightIcon.appendChild(line9);
                lightIcon.appendChild(line10);
                lightIcon.appendChild(line11);
                lightIcon.appendChild(line12);
                lightIcon.appendChild(line13);
                lightIcon.appendChild(line14);
                lightIcon.appendChild(line15);
                lightIcon.appendChild(line16);
                
                templateButton.appendChild(lightIcon);
            } else {
                const darkIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                darkIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                darkIcon.setAttribute('width', '16');
                darkIcon.setAttribute('height', '16');
                darkIcon.setAttribute('viewBox', '0 0 24 24');
                darkIcon.setAttribute('fill', 'none');
                darkIcon.setAttribute('stroke', 'currentColor');
                darkIcon.setAttribute('stroke-width', '2');
                darkIcon.setAttribute('stroke-linecap', 'round');
                darkIcon.setAttribute('stroke-linejoin', 'round');
                darkIcon.classList.add('dark-template-icon');
                
                const path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path3.setAttribute('d', 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z');
                
                darkIcon.appendChild(path3);
                
                templateButton.appendChild(darkIcon);
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
            };
            if (template.id === 'default') {
                templateButton.addClass('active');
            }
        });
        
        // 创建样式选择区域
        const styleSection = controlsPanel.createDiv({ cls: 'control-section' });
        styleSection.createEl('div', { text: '选择样式', cls: 'section-title' });
        
        // 创建样式选择器
        const styleSelector = styleSection.createDiv({ cls: 'style-selector' });
        
        // 添加样式选择按钮
        MARKDOWN_STYLES.forEach(style => {
            const styleButton = styleSelector.createEl('button', {
                cls: 'style-button',
                text: style.name,
                attr: { 'data-style': style.id, 'title': style.description }
            });
            
            // 设置当前活动样式
            if (style.id === this.imageGenerator.getCurrentStyle()) {
                styleButton.classList.add('active');
            }
            
            // 添加点击事件
            styleButton.addEventListener('click', async () => {
                // 移除所有活动状态
                styleSelector.findAll('.style-button').forEach(btn => 
                    btn.removeClass('active')
                );
                
                // 设置当前按钮为活动状态
                styleButton.addClass('active');
                
                // 添加动画效果
                styleButton.animate([
                    { transform: 'scale(0.95)' },
                    { transform: 'scale(1)' }
                ], {
                    duration: 150,
                    easing: 'ease-out'
                });
                
                // 设置新样式并重新渲染
                await this.imageGenerator.setStyle(style.id);
                
                // 更新画布
                canvasContainer.empty();
                const newCanvas = this.imageGenerator.getCanvas();
                canvasContainer.appendChild(newCanvas);
                
                // 更新模态框大小
                adjustModalSize(newCanvas.width, newCanvas.height);
            });
        });
        
        // 等待初始画布渲染完成
        await this.imageGenerator.updateCanvas();
        const canvas = this.imageGenerator.getCanvas();
        canvasContainer.appendChild(canvas);
        
        // 更新模态框大小以适应画布
        adjustModalSize(canvas.width, canvas.height);

        // 添加复制按钮点击事件
        copyButton.addEventListener('click', async () => {
            copyButton.classList.add('clicked');
            
            const success = await this.imageGenerator.copyToClipboard();
            
            const createToast = (success: boolean, message: string) => {
                const toast = document.createElement('div');
                toast.className = 'download-toast';
                
                // Create icon
                if (success) {
                    const successIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    successIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                    successIcon.setAttribute('width', '24');
                    successIcon.setAttribute('height', '24');
                    successIcon.setAttribute('viewBox', '0 0 24 24');
                    successIcon.setAttribute('fill', 'none');
                    successIcon.setAttribute('stroke', 'currentColor');
                    successIcon.setAttribute('stroke-width', '2');
                    successIcon.setAttribute('stroke-linecap', 'round');
                    successIcon.setAttribute('stroke-linejoin', 'round');
                    
                    const circle3 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle3.setAttribute('cx', '12');
                    circle3.setAttribute('cy', '12');
                    circle3.setAttribute('r', '10');
                    
                    const path4 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path4.setAttribute('d', 'M8 12l2 2 4-4');
                    
                    successIcon.appendChild(circle3);
                    successIcon.appendChild(path4);
                    toast.appendChild(successIcon);
                } else {
                    const errorIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    errorIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                    errorIcon.setAttribute('width', '24');
                    errorIcon.setAttribute('height', '24');
                    errorIcon.setAttribute('viewBox', '0 0 24 24');
                    errorIcon.setAttribute('fill', 'none');
                    errorIcon.setAttribute('stroke', 'currentColor');
                    errorIcon.setAttribute('stroke-width', '2');
                    errorIcon.setAttribute('stroke-linecap', 'round');
                    errorIcon.setAttribute('stroke-linejoin', 'round');
                    
                    const circle4 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle4.setAttribute('cx', '12');
                    circle4.setAttribute('cy', '12');
                    circle4.setAttribute('r', '10');
                    
                    const line17 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line17.setAttribute('x1', '15');
                    line17.setAttribute('y1', '9');
                    line17.setAttribute('x2', '9');
                    line17.setAttribute('y2', '15');
                    
                    const line18 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line18.setAttribute('x1', '9');
                    line18.setAttribute('y1', '9');
                    line18.setAttribute('x2', '15');
                    line18.setAttribute('y2', '15');
                    
                    errorIcon.appendChild(circle4);
                    errorIcon.appendChild(line17);
                    errorIcon.appendChild(line18);
                    toast.appendChild(errorIcon);
                }
                
                const messageSpan = document.createElement('span');
                messageSpan.textContent = message;
                toast.appendChild(messageSpan);
                
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    toast.classList.add('hide');
                    setTimeout(() => {
                        document.body.removeChild(toast);
                    }, 300);
                }, 3000);
            };
            
            createToast(success, success ? '已复制到剪贴板' : '复制失败');
        });
        
        // 添加下载按钮点击事件
        downloadButton.addEventListener('click', () => {
            downloadButton.classList.add('clicked');
            
            // 生成下载
            const link = document.createElement('a');
            link.download = `Obsidian-${new Date().toISOString().replace(/:/g, '-')}.png`;
            link.href = this.imageGenerator.getDataURL();
            link.click();
            
            const createToast = (success: boolean, message: string) => {
                const toast = document.createElement('div');
                toast.className = 'download-toast';
                
                // Create icon
                if (success) {
                    const successIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    successIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                    successIcon.setAttribute('width', '24');
                    successIcon.setAttribute('height', '24');
                    successIcon.setAttribute('viewBox', '0 0 24 24');
                    successIcon.setAttribute('fill', 'none');
                    successIcon.setAttribute('stroke', 'currentColor');
                    successIcon.setAttribute('stroke-width', '2');
                    successIcon.setAttribute('stroke-linecap', 'round');
                    successIcon.setAttribute('stroke-linejoin', 'round');
                    
                    const circle5 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle5.setAttribute('cx', '12');
                    circle5.setAttribute('cy', '12');
                    circle5.setAttribute('r', '10');
                    
                    const path5 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path5.setAttribute('d', 'M8 12l2 2 4-4');
                    
                    successIcon.appendChild(circle5);
                    successIcon.appendChild(path5);
                    toast.appendChild(successIcon);
                } else {
                    const errorIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    errorIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                    errorIcon.setAttribute('width', '24');
                    errorIcon.setAttribute('height', '24');
                    errorIcon.setAttribute('viewBox', '0 0 24 24');
                    errorIcon.setAttribute('fill', 'none');
                    errorIcon.setAttribute('stroke', 'currentColor');
                    errorIcon.setAttribute('stroke-width', '2');
                    errorIcon.setAttribute('stroke-linecap', 'round');
                    errorIcon.setAttribute('stroke-linejoin', 'round');
                    
                    const circle6 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle6.setAttribute('cx', '12');
                    circle6.setAttribute('cy', '12');
                    circle6.setAttribute('r', '10');
                    
                    const line19 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line19.setAttribute('x1', '15');
                    line19.setAttribute('y1', '9');
                    line19.setAttribute('x2', '9');
                    line19.setAttribute('y2', '15');
                    
                    const line20 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line20.setAttribute('x1', '9');
                    line20.setAttribute('y1', '9');
                    line20.setAttribute('x2', '15');
                    line20.setAttribute('y2', '15');
                    
                    errorIcon.appendChild(circle6);
                    errorIcon.appendChild(line19);
                    errorIcon.appendChild(line20);
                    toast.appendChild(errorIcon);
                }
                
                const messageSpan = document.createElement('span');
                messageSpan.textContent = message;
                toast.appendChild(messageSpan);
                
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    toast.classList.add('hide');
                    setTimeout(() => {
                        document.body.removeChild(toast);
                    }, 300);
                }, 3000);
            };
            
            createToast(true, '已开始下载');
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

// Define the available markdown styles
const MARKDOWN_STYLES = [
    {
        id: 'default',
        name: '默认样式',
        description: '默认的高对比度样式，有彩色强调'
    },
    {
        id: 'modern',
        name: '得到样式',
        description: '知识付费平台"得到"的清晰阅读风格'
    },
    {
        id: 'minimal',
        name: '少数派样式',
        description: '简约优雅的排版，橙红色点缀'
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