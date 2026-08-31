import { createIcon } from './icons';

export type ToastVariant = 'success' | 'error';

/**
 * Show a transient toast notification at the bottom of the screen.
 * Replaces the duplicated toast logic that previously lived inline
 * in each click handler.
 */
export function showToast(success: boolean, message: string): void {
	const toast = document.createElement('div');
	toast.className = `download-toast is-${success ? 'success' : 'error'}`;

	const icon = createIcon(success ? 'check-circle-icon' : 'x-circle-icon');
	if (icon) {
		icon.setAttribute('width', '24');
		icon.setAttribute('height', '24');
		icon.setAttribute('viewBox', '0 0 24 24');
		toast.appendChild(icon);
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
}
