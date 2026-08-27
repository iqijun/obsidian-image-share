const NS = 'http://www.w3.org/2000/svg';

function svg(iconClass: string, children: (el: SVGElement) => void): SVGSVGElement {
	const el = document.createElementNS(NS, 'svg');
	el.setAttribute('xmlns', NS);
	el.setAttribute('width', '18');
	el.setAttribute('height', '18');
	el.setAttribute('viewBox', '0 0 24 24');
	el.setAttribute('fill', 'none');
	el.setAttribute('stroke', 'currentColor');
	el.setAttribute('stroke-width', '2');
	el.setAttribute('stroke-linecap', 'round');
	el.setAttribute('stroke-linejoin', 'round');
	el.classList.add(iconClass);
	children(el);
	return el;
}

function append(parent: SVGElement, name: string, attrs: Record<string, string>): void {
	const child = document.createElementNS(NS, name);
	for (const [k, v] of Object.entries(attrs)) {
		child.setAttribute(k, v);
	}
	parent.appendChild(child);
}

const iconBuilders: Record<string, () => SVGSVGElement> = {
	'sun-icon': () =>
		svg('sun-icon', (s) => {
			append(s, 'circle', { cx: '12', cy: '12', r: '5' });
			append(s, 'line', { x1: '12', y1: '1', x2: '12', y2: '3' });
			append(s, 'line', { x1: '12', y1: '21', x2: '12', y2: '23' });
			append(s, 'line', { x1: '4.22', y1: '4.22', x2: '5.64', y2: '5.64' });
			append(s, 'line', { x1: '18.36', y1: '18.36', x2: '19.78', y2: '19.78' });
			append(s, 'line', { x1: '1', y1: '12', x2: '3', y2: '12' });
			append(s, 'line', { x1: '21', y1: '12', x2: '23', y2: '12' });
			append(s, 'line', { x1: '4.22', y1: '19.78', x2: '5.64', y2: '18.36' });
			append(s, 'line', { x1: '18.36', y1: '5.64', x2: '19.78', y2: '4.22' });
		}),

	'moon-icon': () =>
		svg('moon-icon', (s) => {
			append(s, 'path', { d: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z' });
		}),

	'download-icon': () =>
		svg('download-icon', (s) => {
			append(s, 'path', { d: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4' });
			append(s, 'polyline', { points: '7 10 12 15 17 10' });
			append(s, 'line', { x1: '12', y1: '15', x2: '12', y2: '3' });
		}),

	'copy-icon': () =>
		svg('copy-icon', (s) => {
			append(s, 'rect', { x: '9', y: '9', width: '13', height: '13', rx: '2', ry: '2' });
			append(s, 'path', { d: 'M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1' });
		}),

	'check-circle-icon': () =>
		svg('check-circle-icon', (s) => {
			append(s, 'circle', { cx: '12', cy: '12', r: '10' });
			append(s, 'path', { d: 'M8 12l2 2 4-4' });
		}),

	'x-circle-icon': () =>
		svg('x-circle-icon', (s) => {
			append(s, 'circle', { cx: '12', cy: '12', r: '10' });
			append(s, 'line', { x1: '15', y1: '9', x2: '9', y2: '15' });
			append(s, 'line', { x1: '9', y1: '9', x2: '15', y2: '15' });
		}),
};

/** Create an icon element by name. Returns null for unknown names. */
export function createIcon(name: keyof typeof iconBuilders | string): SVGSVGElement | null {
	const builder = iconBuilders[name];
	return builder ? builder() : null;
}
