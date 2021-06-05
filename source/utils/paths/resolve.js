// Path and Url resolve functions do not behave the way we want with trialing slashes

import Path from 'path';

export default function resolve(path, descriptor) {
	let result = Path.resolve(path, descriptor);
	if (descriptor.endsWith('/')) {
		result = Path.join(result, '/');
	}
	return result;
}
