import Path from 'path';
import React from 'react';
import ChildContext from '../../contexts/child';
import SplatContext from '../../contexts/splat';
import ParamsContext from '../../contexts/params';
import ResourceContext from '../../contexts/resource';

import createResource from '../create-resource';

function Route(props) {
	let { params, splat, resource, component: Component, children, ...other } = props;

	return (
		<ResourceContext.Provider value={resource}>
			<ParamsContext.Provider value={params}>
				<SplatContext.Provider value={splat}>
					<ChildContext.Provider value={children}>
						<Component {...other}>{children}</Component>
					</ChildContext.Provider>
				</SplatContext.Provider>
			</ParamsContext.Provider>
		</ResourceContext.Provider>
	);
}

export default function routeElement(routes, path, base = '/') {
	for (let route of routes) {
		let strict = route.routes == undefined;
		let match = route.path(path, base, strict);

		if (match) {
			let { splat, params, length } = match;
			let pathname = Path.join(base, path);
			let matched = pathname.slice(0, length);
			let unmatched = pathname.slice(length);

			let resource = route.data ? createResource(route.data(params)) : undefined;
			let component = route.render;

			let childPath = unmatched;
			let childBase = Path.join(base, matched);
			let childRoute = route.routes ? routeElement(route.routes, childPath, childBase) : null;

			let element = (
				<Route params={params} splat={splat} resource={resource} component={component}>
					{childRoute}
				</Route>
			);

			return element;
		}
	}

	return null;
}
