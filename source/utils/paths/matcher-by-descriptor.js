import Path from 'path';

import isSplatSegment from './is-splat-segment';
import isParamSegment from './is-param-segment';

export default function matcherByDescriptor(descriptor) {
	return function (path, base, strict) {
		let splat;
		let params;

		let paramNames = [];
		let paramValues = [];

		// Using URL to find the pathname part does not work when
		// path is the empty string. Then the result becomes "/" instead of ""
		let match = path.match(/([^?#]*)(\?[^#]*)?(#.*)?/);
		let pathName = match[1];
		let pathParts = pathName.split('/');

		let baseParts = [''];
		let baseDescriptor = Path.join(base, descriptor);
		let descriptorParts = baseDescriptor.split('/');

		while (descriptorParts.length) {
			let descriptorPart = descriptorParts.shift();
			if (descriptorPart === '') {
				if (pathParts.length === 0) return;
				if (descriptorParts.length || strict) {
					let pathPart = pathParts.shift();
					if (pathPart !== '') return;
				}
			} else if (isParamSegment(descriptorPart)) {
				if (pathParts.length === 0) return;
				let pathPart = pathParts.shift();
				if (pathPart === '') return;
				let paramName = descriptorPart.slice(1);
				paramNames = [...paramNames, paramName];
				paramValues = [...paramValues, pathPart];
				baseParts.push(pathPart);
			} else if (isSplatSegment(descriptorPart)) {
				if (pathParts.filter(part => part !== '').length === 0) return;
				splat = pathParts;
				pathParts = [];
				descriptorParts = [];
			} else {
				let pathPart = pathParts.shift();
				if (pathPart !== descriptorPart) return;
				baseParts.push(pathPart);
			}
		}

		if (strict && pathParts.length > 0) return;

		if (splat == undefined) {
			splat = pathParts;
		}

		if (params == undefined) {
			let hasEmptyParamName = paramNames.find(name => name === '');
			if (hasEmptyParamName) {
				params = paramValues;
			} else {
				params = {};
				for (let index = 0; index < paramNames.length && index < paramValues.length; ++index) {
					params[paramNames[index]] = paramValues[index];
				}
			}
		}

		return { base: baseParts.join('/'), params, splat };
	};
}
