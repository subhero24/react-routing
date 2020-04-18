import isSplatSegment from './is-splat-segment';
import isParamSegment from './is-param-segment';
import isStaticSegment from './is-static-segment';

export default function score(path = '*') {
	if (typeof path !== 'string') return 0;

	path = path.replace(/^\//, '');
	path = path.replace(/\/$/, '');

	let segments = path.split('/');
	let score = segments.length * 4;

	if (path === '.') score += 1;
	for (let segment of segments) {
		if (isSplatSegment(segment)) score += -1;
		if (isParamSegment(segment)) score += 2;
		if (isStaticSegment(segment)) score += 3;
	}
	return score;
}
