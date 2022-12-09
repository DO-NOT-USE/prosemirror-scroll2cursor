import { Plugin } from 'prosemirror-state';

const DEFAULT_DELAY = 100;
const DEFAULT_OFFSET_BOTTOM = 64;
const DEFAULT_OFFEST_TOP = 64;
const DEFAULT_SCROLL_DISTANCE = 96;

/**
 * Options for customizing Scroll2Cursor plugin
 */
export type Scroll2CursorOptions = {
	/**
	 * The HTML element that wraps around the editor on which you would
	 * call `scrollTo` to scroll to the cursor. Default to `window`.
	 */
	scrollerElement?: HTMLElement,
	/**
	 * Number of milliseconds to wait before starting scrolling. The main reason
	 * for the delay is that it helps prevent flickering when the user hold down
	 * the up/down key. Default to 50.
	 */
	delay?: number,
	/**
	 * Used to override the default function in case there is another
	 * platform-specific implementation.
	 */
	computeScrollTop?: () => number,
	/**
	 * Number of pixels from the bottom where cursor position should be
	 * considered too low. Default to 64.
	 */
	offsetBottom?: number,
	/**
	 * Number of pixels from the top where cursor position should be considered
	 * too high. Default to 168.
	 */
	offsetTop?: number,
	/**
	 * Number of pixels you want to scroll downward/upward when the cursor is
	 * too low/high the. Default to 96.
	 */
	scrollDistance?: number,
	/**
	 * When debugMode is false or not set, the plugin will not print anything to
	 * the console.
	 */
	debugMode?: boolean
};

/**
 * Scroll2Cursor plugin makes sure the cursor is always visible and at the
 * position that is comfortable for typing, not too low at the bottom or too
 * high at the top;
 */
export const newScroll2CursorPlugin = (options?: Scroll2CursorOptions): Plugin => {
	let timeoutScroll: ReturnType<typeof setTimeout>;
	const offsetBottom = options?.offsetBottom ?? DEFAULT_OFFSET_BOTTOM;
	const offsetTop = options?.offsetTop ?? DEFAULT_OFFEST_TOP;
	const scrollDistance = options?.scrollDistance ?? DEFAULT_SCROLL_DISTANCE;
	const scrollerHeight = options?.scrollerElement?.getBoundingClientRect().height ?? window.innerHeight;

	function scrollTo(x: number, y: number) {
		(options?.scrollerElement ?? window).scrollTo(x, y);
	}

	return new Plugin({
		props: {
			handleScrollToSelection(view) {
				if (scrollerHeight <= offsetBottom + offsetTop + scrollDistance) {
					options?.debugMode
						&& console.info("The window height is too small for the scrolling configurations");
					return false;
				}

				timeoutScroll && clearTimeout(timeoutScroll);
				timeoutScroll = setTimeout(function () {
					let top = view.coordsAtPos(view.state.selection.$head.pos).top - (options?.scrollerElement?.getBoundingClientRect().top ?? 0);

					const scrollTop = options?.computeScrollTop
						? options.computeScrollTop()
						: options?.scrollerElement?.scrollTop ?? (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop) ?? -1;

					if (scrollTop === -1) {
						options?.debugMode && console.error("The plugin could not determine scrollTop");
						return;
					}

					const offBottom = top + offsetBottom - scrollerHeight;
					if (offBottom > 0) {
						scrollTo(0, scrollTop + offBottom + scrollDistance);
						return;
					}

					const offTop = top - offsetTop;
					if (offTop < 0) {
						scrollTo(0, scrollTop + offTop - scrollDistance);
					}
				}, options?.delay ?? DEFAULT_DELAY);

				return true;
			}
		}
	});
}