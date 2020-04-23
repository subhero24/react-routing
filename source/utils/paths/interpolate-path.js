import isParamSegment from '../paths/is-param-segment';
import isStaticSegment from '../paths/is-static-segment';
import isSplatSegment from '../paths/is-splat-segment';

// Interpolates the path descriptor with its params and splat
// Example: /users/:id/* -> /users/1/profile/address
export default function interpolate(path, params, splat) {
	let index = 0;
	let result = [];
	let segments = path.split('/');
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

	return result.join('/');
}
