import sortByPathScore from './sort-by-path-score';

export default function transformRouteOrder(routes) {
	let transformedRoutes = routes.map(function(route) {
		let result = { ...route };
		if (route.routes != undefined) {
			result.routes = transformRouteOrder(route.routes);
		}
		return result;
	});

	return sortByPathScore(transformedRoutes);
}
