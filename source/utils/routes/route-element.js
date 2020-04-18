import Path from 'path';
import React from 'react';
import Redirect from '../../components/redirect';
import ChildContext from '../../contexts/child';
import SplatContext from '../../contexts/splat';
import ParamsContext from '../../contexts/params';
import ResourceContext from '../../contexts/resource';

import isParamSegment from '../paths/is-param-segment';
import createResource from '../create-resource';
import isStaticSegment from '../paths/is-static-segment';
import isSplatSegment from '../paths/is-splat-segment';

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

class RedirectError extends Error {
	constructor(to, message) {
		super(message);
		this.to = to;
	}
}

export default function rootRouteElement(routes, path, base = '/') {
	let element = null;
	while (element == null) {
		try {
			return routeElement(routes, path, base);
		} catch (error) {
			if (error instanceof RedirectError) {
				let basePath = Path.join(base, path);
				if (basePath === error.to) {
					return null;
				} else {
					path = Path.join('/', Path.relative(base, error.to));
				}
			} else {
				throw error;
			}
		}
	}
	return element;
}

function routeElement(routes, path, base = '/') {
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
			if (component === Redirect) {
				let targetPath = interpolate(route.redirect, params, splat);
				let targetBase = Path.join(base, targetPath);
				throw new RedirectError(targetBase);
			}

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

function interpolate(path, params, splat) {
	let index = 0;
	let result = [];
	let segments = path.split('/');
	for (let segment of segments) {
		if (isStaticSegment(segment)) {
			result.push(segment);
		} else if (isParamSegment(segment)) {
			let paramName = segment.slice(1);
			if (params instanceof Array) {
				result.push(params[index++]);
			} else {
				result.push(params[paramName]);
			}
		} else if (isSplatSegment(segment)) {
			result.push(...splat);
		}
	}

	return result.join('/');
}
