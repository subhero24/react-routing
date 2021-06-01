import Path from 'path';

import isDotSegment from './is-dot-segment.js';
import isParamSegment from './is-param-segment.js';
import isSplatSegment from './is-splat-segment.js';
import isStaticSegment from './is-static-segment.js';

const leadingSlashes = /^\/+/;

export default function matcher(descriptor, pathName, root = '/') {
	let base = root;
	let params = {};
	if (descriptor == undefined) {
		let path = pathName;
		let splat = pathName.replace(leadingSlashes, '').split('/');
		let strict = true;

		return { base, path, params, splat, strict };
	}

	// When matching absolute descriptors, we need to make the path absolute too for matching
	if (descriptor.startsWith('/')) {
		pathName = Path.join(base, pathName);
	}

	pathName = pathName.replace(leadingSlashes, '');
	descriptor = descriptor.replace(leadingSlashes, '');

	let pathParts = pathName.split('/');
	let descriptorParts = descriptor.split('/');

	while (descriptorParts.length) {
		let descriptorPart = descriptorParts.shift();
		if (isParamSegment(descriptorPart)) {
			let pathPart = pathParts.shift();
			if (pathPart == undefined) return;
			if (pathPart === '' && pathParts.length === 0) return;

			let paramName = descriptorPart.slice(1);
			if (paramName.length) {
				params[paramName] = pathPart;
			}

			base = Path.join(base, pathPart);
		} else if (isSplatSegment(descriptorPart)) {
			let pathPart = pathParts.shift();
			if (pathPart === '' && pathParts.length === 0) return;

			descriptorParts = [];
		} else if (isStaticSegment(descriptorPart)) {
			let pathPart = pathParts.shift();
			if (pathPart !== descriptorPart) return;

			base = Path.join(base, pathPart);
		} else if (isDotSegment(descriptorPart)) {
			let pathPart = pathParts.shift();
			if (pathPart !== '') return;
		}
	}

	let path = pathParts.join('/');
	let splat = pathParts;
	let strict = pathParts.length === 0;

	return { base, path, params, splat, strict };
}
