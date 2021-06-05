import * as Path from '../path.js';

import isParamSegment from './is-param-segment.js';
import isSplatSegment from './is-splat-segment.js';
import isStaticSegment from './is-static-segment.js';

const slashesRegex = /^\/+|\/+$/g;

export default function matcher(descriptor, pathname, root = '/') {
	if (descriptor == undefined) {
		let base = root;
		let path = pathname;
		let splat = pathname.replace(slashesRegex, '').split('/');
		let params = {};
		let strict = true;

		return { base, path, params, splat, strict };
	}

	let absolutePathname = Path.join(root, pathname);
	let absoluteDescriptor = Path.resolve(root, descriptor);
	let pathnameParts = absolutePathname.replace(slashesRegex, '').split('/');
	let descriptorParts = absoluteDescriptor.replace(slashesRegex, '').split('/');
	let pathnameEndsWithSlash = absolutePathname.endsWith('/');
	let descriptorEndsWithSlash = absoluteDescriptor.endsWith('/');

	let base = '/';
	let params = {};
	let strict;
	while (descriptorParts.length) {
		let descriptorPart = descriptorParts.shift();
		if (isSplatSegment(descriptorPart)) {
			if (pathnameParts.length === 0) return;

			strict = pathnameEndsWithSlash === descriptorEndsWithSlash;
			break;
		} else {
			let pathPart = pathnameParts.shift();
			if (isStaticSegment(descriptorPart)) {
				if (pathPart !== descriptorPart) return;

				base = Path.join(base, pathPart, descriptorEndsWithSlash ? '/' : '');
			} else if (isParamSegment(descriptorPart)) {
				if (pathPart == undefined) return;
				let paramName = descriptorPart.slice(1);
				if (paramName.length) {
					params[paramName] = pathPart;
				}

				base = Path.join(base, pathPart, descriptorEndsWithSlash ? '/' : '');
			}
		}
	}

	if (descriptorEndsWithSlash && pathnameEndsWithSlash === false) return;

	let path = Path.relative(base, absolutePathname);
	let splat = pathnameParts;
	if (strict == undefined) {
		strict = path.length === 0;
	}

	return { base, path, params, splat, strict };
}
