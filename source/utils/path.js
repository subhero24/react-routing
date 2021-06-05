// Path and Url packages do not behave the way we want with trialing slashes

import Path from 'path';

export { join } from 'path';

export function resolve(path, descriptor) {
	let result = Path.resolve(path, descriptor);
	if (descriptor.endsWith('/')) {
		result = Path.join(result, '/');
	}
	return result;
}

export function relative(from, to) {
	let result = Path.relative(from, to);
	if (from.endsWith('/') === false && to.endsWith('/')) {
		result = Path.join(result, '/');
	}
	return result;
}
