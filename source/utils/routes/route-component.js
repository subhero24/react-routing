import Path from 'path';
import React from 'react';
import ChildContext from '../../contexts/child';
import ParamsContext from '../../contexts/params';
import ResourceContext from '../../contexts/resource';

import createResource from '../create-resource';

export default function routeComponent(routes, path, base = '/') {
	for (let route of routes) {
		let strict = route.routes == undefined;
		let match = route.path(path, base, strict);

		if (match) {
			let { params, length } = match;
			let pathname = Path.join(base, path);
			let matched = pathname.slice(0, length);
			let unmatched = pathname.slice(length);

			let resource = route.data ? createResource(route.data(params)) : undefined;
			let childPath = unmatched;
			let childBase = Path.join(base, matched);

			let RouteComponent = route.render;
			let ChildComponent = route.routes ? routeComponent(route.routes, childPath, childBase) : () => null;

			return function Route(props) {
				return (
					<ResourceContext.Provider value={resource}>
						<ParamsContext.Provider value={params}>
							<ChildContext.Provider value={ChildComponent}>
								<RouteComponent {...props}>
									<ChildComponent />
								</RouteComponent>
							</ChildContext.Provider>
						</ParamsContext.Provider>
					</ResourceContext.Provider>
				);
			};
		}
	}

	return undefined;
}
