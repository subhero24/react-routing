import matcherByRegex from '../paths/matcher-by-regex';
import matcherByFunction from '../paths/matcher-by-function';
import matcherByUndefined from '../paths/matcher-by-undefined';
import matcherByDescriptor from '../paths/matcher-by-descriptor';

export default function transformRoutePaths(routes) {
	return routes.map(function (route) {
		let result = { ...route };
		if (typeof route.path === 'string') {
			result.path = matcherByDescriptor(result.path);
		} else if (route.path instanceof RegExp) {
			result.path = matcherByRegex(result.path);
		} else if (typeof route.path === 'function') {
			result.path = matcherByFunction(route.path);
		} else if (route.path == undefined) {
			result.path = matcherByUndefined();
		}

		if (route.routes) {
			result.routes = transformRoutePaths(route.routes);
		}
		return result;
	});
}
