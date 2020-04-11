import isSplatSegment from './is-splat-segment';
import isStaticSegment from './is-static-segment';
import isDynamicSegment from './is-dynamic-segment';

export default function score(path = '*') {
	if (typeof path !== 'string') return 0;

	path = path.replace(/^\//, '');
	path = path.replace(/\/$/, '');

	let segments = path.split('/');
	let score = segments.length * 4;

	if (path === '/') score += 1;
	for (let segment of segments) {
		if (isSplatSegment(segment)) score += -1;
		if (isStaticSegment(segment)) score += 3;
		if (isDynamicSegment(segment)) score += 2;
	}
	return score;
}
