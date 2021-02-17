import { join } from 'path';

export default function matcherByDescriptor(descriptor) {
	return function (path, base, strict) {
		let splat;
		let params;
		let length = 0;
		let paramNames = [];
		let paramValues = [];

		// Using URL to find the pathname part does not work when
		// path is the empty string. Then the result becomes "/" instead of ""
		let pathName = path.split('?')[0];
		let pathParts = join(base, pathName).split('/');
		let descriptorParts = join(base, descriptor).split('/');

		while (descriptorParts.length) {
			let descriptorPart = descriptorParts.shift();
			if (descriptorPart === '') {
				if (pathParts.length === 0) return;
				if (descriptorParts.length || strict) {
					let pathPart = pathParts.shift();
					if (pathPart !== '') return;
				}
			} else if (descriptorPart[0] === ':') {
				if (pathParts.length === 0) return;
				let pathPart = pathParts.shift();
				if (pathPart === '') return;
				let paramName = descriptorPart.slice(1);
				paramNames = [...paramNames, paramName];
				paramValues = [...paramValues, pathPart];
				length = length + pathPart.length + 1;
			} else if (descriptorPart[0] === '*') {
				if (pathParts.filter(part => part !== '').length === 0) return;
				splat = pathParts;
				pathParts = [];
				descriptorParts = [];
			} else {
				let pathPart = pathParts.shift();
				if (pathPart !== descriptorPart) return;
				length = length + pathPart.length + 1;
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

		return { splat, params, length };
	};
}
