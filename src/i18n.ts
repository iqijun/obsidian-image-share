import { moment } from 'obsidian';

export type Locale = 'zh-CN' | 'en';

type Dict = Record<string, string>;

const en: Dict = {
	// Modal titles
	'panel.imageSettings': 'Image Settings',
	'panel.preview': 'Preview',

	// Sections
	'section.theme': 'Theme',
	'section.style': 'Typography Style',
	'section.width': 'Width',
	'section.export': 'Export',

	// Templates
	'template.light': 'Light',
	'template.dark': 'Dark',

	// Styles
	'style.default': 'Default',
	'style.default.desc': 'High contrast with colorful accents',
	'style.modern': 'Modern',
	'style.modern.desc': 'Contemporary look, blue & pink accents',
	'style.minimal': 'Minimal',
	'style.minimal.desc': 'Simple and elegant black & white',

	// Buttons
	'action.download': 'Download',
	'action.copy': 'Copy to clipboard',
	'aria.download': 'Download share image',
	'aria.copy': 'Copy image to clipboard',

	// Toasts
	'toast.copied': 'Copied to clipboard',
	'toast.copyFailed': 'Failed to copy',
	'toast.downloading': 'Download started',
	'toast.rendering': 'Rendering…',

	// Commands
	'command.shareAsImage.title': 'Share selected text as image',
	'command.shareAsImage.menu': 'Share as Image',

	// Settings
	'settings.title': 'Image Share',
	'settings.appearance': 'Appearance',
	'settings.defaultTheme': 'Default theme',
	'settings.defaultTheme.desc': 'Theme used when opening the preview dialog.',
	'settings.defaultStyle': 'Default typography style',
	'settings.defaultStyle.desc': 'Markdown rendering style used by default.',
	'settings.export': 'Export',
	'settings.format': 'Export format',
	'settings.format.desc': 'File format used when downloading images.',
	'settings.quality': 'JPEG quality',
	'settings.quality.desc': 'Only applies to JPEG exports. Higher is better quality but larger file.',
	'settings.i18n': 'Language',
	'settings.language': 'Interface language',
	'settings.language.desc': 'Language for this plugin\'s UI. Default follows Obsidian.',

	// Misc
	'misc.language.auto': 'Follow Obsidian',
};

const zhCN: Dict = {
	'panel.imageSettings': '图片设置',
	'panel.preview': '图片预览',

	'section.theme': '选择主题',
	'section.style': '选择样式',
	'section.width': '宽度',
	'section.export': '导出图片',

	'template.light': '浅色模板',
	'template.dark': '深色模板',

	'style.default': '默认样式',
	'style.default.desc': '默认的高对比度样式，有彩色强调',
	'style.modern': '现代样式',
	'style.modern.desc': '现代设计风格，蓝色和粉色强调',
	'style.minimal': '极简样式',
	'style.minimal.desc': '简约而优雅的黑白设计',

	'action.download': '下载图片',
	'action.copy': '复制到剪贴板',
	'aria.download': '下载分享图片',
	'aria.copy': '复制图片到剪贴板',

	'toast.copied': '已复制到剪贴板',
	'toast.copyFailed': '复制失败',
	'toast.downloading': '已开始下载',
	'toast.rendering': '渲染中…',

	'command.shareAsImage.title': '将选中文本分享为图片',
	'command.shareAsImage.menu': '分享为图片',

	'settings.title': 'Image Share 图片分享',
	'settings.appearance': '外观',
	'settings.defaultTheme': '默认主题',
	'settings.defaultTheme.desc': '打开预览弹窗时使用的主题。',
	'settings.defaultStyle': '默认排版样式',
	'settings.defaultStyle.desc': '默认使用的 Markdown 渲染样式。',
	'settings.export': '导出',
	'settings.format': '导出格式',
	'settings.format.desc': '下载图片时使用的文件格式。',
	'settings.quality': 'JPEG 质量',
	'settings.quality.desc': '仅对 JPEG 导出生效。质量越高，体积越大。',
	'settings.i18n': '语言',
	'settings.language': '界面语言',
	'settings.language.desc': "插件界面的显示语言。默认跟随 Obsidian。",

	'misc.language.auto': '跟随 Obsidian',
};

const dictionaries: Record<Locale, Dict> = {
	'en': en,
	'zh-CN': zhCN,
};

let currentLocale: Locale = 'zh-CN';

/** Detect the locale from Obsidian's language setting (via moment). */
export function detectLocale(): Locale {
	const obsidianLang = moment.locale();
	if (!obsidianLang) return 'zh-CN';
	return obsidianLang.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}

/** Set the active locale. Pass a valid Locale or leave empty to auto-detect. */
export function setLocale(locale?: Locale): void {
	currentLocale = locale ?? detectLocale();
}

export function getLocale(): Locale {
	return currentLocale;
}

/** Translate a key in the current locale. Falls back to English, then the key itself. */
export function t(key: string): string {
	return dictionaries[currentLocale][key] ?? en[key] ?? key;
}
