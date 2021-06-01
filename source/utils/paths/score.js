import isParamSegment from './is-param-segment.js';
import isStaticSegment from './is-static-segment.js';

export default function score(path = '*') {
	let segments = path.replace(/^\/+|\/+$/, '').split('/');

	let params = segments.filter(isParamSegment).length;
	let statics = segments.filter(isStaticSegment).length;
	let trailing = path.endsWith('/') ? 1 : 0;

	return [segments.length, statics, params, trailing];
}
