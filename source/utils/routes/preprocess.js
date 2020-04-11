import { isValidElement } from 'react';
import transformRouteOrder from './transform-route-order';
import transformRoutePaths from './transform-route-paths';
import routesFromReactElement from './routes-from-react-element';

export default function preprocessRoutes(routes) {
	routes = isValidElement(routes) ? routesFromReactElement(routes) : routes;
	routes = transformRouteOrder(routes);
	routes = transformRoutePaths(routes);

	return routes;
}
