export interface ShareTemplate {
	id: string;
	nameKey: string;
	width: number;
}

export interface MarkdownStyle {
	id: string;
	nameKey: string;
	descKey: string;
}

/** Themes available for the generated image. */
export const SHARE_TEMPLATES: ShareTemplate[] = [
	{
		id: 'light',
		nameKey: 'template.light',
		width: 800,
	},
	{
		id: 'dark',
		nameKey: 'template.dark',
		width: 800,
	},
];

/** Typography styles applied to the rendered markdown. */
export const MARKDOWN_STYLES: MarkdownStyle[] = [
	{
		id: 'default',
		nameKey: 'style.default',
		descKey: 'style.default.desc',
	},
	{
		id: 'modern',
		nameKey: 'style.modern',
		descKey: 'style.modern.desc',
	},
	{
		id: 'minimal',
		nameKey: 'style.minimal',
		descKey: 'style.minimal.desc',
	},
];

export const TEMPLATE_IDS = SHARE_TEMPLATES.map((tpl) => tpl.id);
export const STYLE_IDS = MARKDOWN_STYLES.map((style) => style.id);
