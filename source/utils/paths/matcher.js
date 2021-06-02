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

	let path;
	let splat;
	let strict;
	while (descriptorParts.length) {
		let descriptorPart = descriptorParts.shift();
		if (isSplatSegment(descriptorPart)) {
			if (pathParts.length === 0) return;
			if (pathParts.length === 1 && pathParts[0] === '') return;

			let pathEndsWithSlash = pathName.endsWith('/');
			let descEndsWithSlash = descriptor.endsWith('/');
			if (descEndsWithSlash && pathEndsWithSlash === false) return;

			// Trim the last empty part of the splat if the path ended with a "/"
			splat = pathParts.slice(0, pathEndsWithSlash ? -1 : undefined);
			strict = pathEndsWithSlash === descEndsWithSlash;

			break;
		} else {
			let pathPart = pathParts.shift();
			if (isStaticSegment(descriptorPart)) {
				if (pathPart !== descriptorPart) return;

				base = Path.join(base, pathPart);
			} else if (isParamSegment(descriptorPart)) {
				if (pathPart == undefined) return;
				if (pathPart === '' && pathParts.length === 0) return;

				let paramName = descriptorPart.slice(1);
				if (paramName.length) {
					params[paramName] = pathPart;
				}

				base = Path.join(base, pathPart);
			} else if (isDotSegment(descriptorPart)) {
				if (pathPart !== '') return;
			}
		}
	}

	path = pathParts.join('/');

	if (splat == undefined) {
		splat = pathParts;
	}
	if (strict == undefined) {
		strict = pathParts.length === 0;
	}

	return { base, path, params, splat, strict };
}
