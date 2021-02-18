import { useEffect } from 'react';
import useImmutableCallback from './use-immutable-callback';

export default function useEventListener(element, event, options, func) {
	if (func == undefined) {
		func = options;
		options = {};
	}

	let { once = false, capture = false, passive = false } = options;

	let handler = useImmutableCallback(func);

	useEffect(() => {
		if (element) {
			let node = element;
			if (element instanceof Object) {
				let keys = Object.keys(element);
				if (keys.length === 1 && keys[0] === 'current') {
					node = element.current;
				}
			}

			node.addEventListener(event, handler, { once, capture, passive });

			return () => {
				node.removeEventListener(event, handler);
			};
		}
	}, [element, event, handler, once, capture, passive]);
}
