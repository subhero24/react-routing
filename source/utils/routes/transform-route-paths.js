import matcherByUndefined from '../paths/matcher-by-undefined';
import matcherByDescriptor from '../paths/matcher-by-descriptor';

export default function transformRoutePaths(routes) {
	return routes.map(function (route) {
		let result = { ...route };
		if (typeof route.path === 'string') {
			result.path = matcherByDescriptor(result.path);
		} else if (route.path == undefined) {
			result.path = matcherByUndefined();
		}

		if (route.routes) {
			result.routes = transformRoutePaths(route.routes);
		}
		return result;
	});
}
