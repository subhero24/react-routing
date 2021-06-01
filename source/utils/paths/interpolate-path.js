import isParamSegment from './is-param-segment.js';
import isStaticSegment from './is-static-segment.js';
import isSplatSegment from './is-splat-segment.js';

// Interpolates the path descriptor with its params and splat
// Example: /users/:id/* -> /users/1/profile/address
export default function interpolate(descriptor, params = {}, splat = [], search = '') {
	let index = 0;
	let result = [];
	let segments = descriptor.split('/');
	for (let segment of segments) {
		if (isStaticSegment(segment)) {
			result.push(segment);
		} else if (isParamSegment(segment)) {
			let paramName = segment.slice(1);
			if (params instanceof Array) {
				result.push(params[index++]);
			} else {
				result.push(params[paramName]);
			}
		} else if (isSplatSegment(segment)) {
			result.push(...splat);
		}
	}

	let path = result.join('/');
	if (descriptor.endsWith('?')) {
		path = path + search;
	}

	return path;
}
