import Path from 'path';
import React from 'react';
import Redirect from '../../components/redirect';
import ChildContext from '../../contexts/child';
import SplatContext from '../../contexts/splat';
import ParamsContext from '../../contexts/params';
import ResourceContext from '../../contexts/resource';

import interpolate from '../paths/interpolate-path';
import createResource from '../create-resource';

function Route(props) {
	let { params, splat, resource, component: Component, children, ...other } = props;

	// There are a lot of contexts provider per route, but as they can change independently,
	// making a context provider with one value is not desirable

	// The ChildContext is used for the <Child /> component, to know what children to render.
	// So we set children on context, even though they are passed as the children of Component.

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

class RedirectError extends Error {
	constructor(to, message) {
		super(message);
		this.to = to;
	}
}

export default function createRootRoute(routes, path, base = '/') {
	// When redirected to a new url, we should check to see if the url was already encountered before,
	// as to prevent an infinite loop in redirects. So we keep an array of all visited paths, to prevent this.
	// With this we can also improve error reporting, as we can specify how the infinite loop of redirects came to be.
	let redirects = [path];

	while (true) {
		try {
			return { path, element: createRoute(routes, path, base) };
		} catch (error) {
			if (error instanceof RedirectError) {
				// We update the path to the new location
				path = Path.join('/', Path.relative(base, error.to));

				// Before continuing to render with the new path, we check for infinite redirect loops
				if (redirects.includes(path)) {
					redirects = [...redirects, path];

					let trail = redirects.join(' to ');
					throw new Error(`There was an infinite loop of redirects. Redirecting from ${trail}.`);
				} else {
					redirects = [...redirects, path];
				}
			} else {
				throw error;
			}
		}
	}
}

function createRoute(routes, path, base = '/', parentParams = {}) {
	for (let route of routes) {
		let strict = route.routes == undefined;
		let match = route.path(path, base, strict);

		if (match) {
			let { params: childParams, splat, length } = match;
			let pathname = Path.join(base, path);
			let matched = pathname.slice(0, length);
			let unmatched = pathname.slice(length);
			let params = { ...parentParams, ...childParams };

			let resource = route.data ? createResource(route.data(params)) : undefined;
			let component = route.render;
			if (component === Redirect) {
				let targetPath = interpolate(route.redirect, params, splat);
				let targetBase = Path.join(base, targetPath);
				throw new RedirectError(targetBase);
			}

			let childPath = unmatched;
			let childBase = Path.join(base, matched);
			let childRoute = route.routes ? createRoute(route.routes, childPath, childBase, params) : null;

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
