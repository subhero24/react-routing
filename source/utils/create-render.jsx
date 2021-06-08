import Url from 'url';
import Path from 'path';
import React from 'react';

import SplatContext from '../contexts/splat.js';
import ParamsContext from '../contexts/params.js';
import ResourceContext from '../contexts/resource.js';

import Redirect from '../components/redirect.jsx';

import useResource from '../hooks/use-resource.js';

import matcher from './paths/matcher.js';
import resolve from './paths/resolve.js';
import interpolate from './paths/interpolate-path.js';
import createResource from './create-resource.js';

function Route(props) {
	let { route, match, params, resource, children } = props;

	let { type: RenderComponent } = route;

	let parentResource = useResource();

	let childIds;
	if (children) {
		childIds = {};
		for (let child of children) {
			if (child.props.route.id == undefined) continue;

			childIds[child.props.route.id] = child;
		}
	}

	return (
		<ResourceContext.Provider value={resource ?? parentResource}>
			<ParamsContext.Provider value={params}>
				<SplatContext.Provider value={match.splat}>
					<RenderComponent child={childIds}>{children}</RenderComponent>
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

export default function createRootRender(routes, rootPath, { base = '/', elements = null }) {
	let [path, search = '', hash = ''] = rootPath.match(/([^?#]*)(\?[^#]*)?(#.*)?/).slice(1);

	// When redirected to a new url, we should check to see if the url was already encountered before,
	// as to prevent an infinite loop in redirects. So we keep an array of all visited paths, to prevent this.
	// With this we can also improve error reporting, as we can specify how the infinite loop of redirects came to be.
	let redirects = [path];

	while (true) {
		try {
			let rootPath = path + search + hash;
			let rootElements = createRender(routes, path, { base, elements, search });

			return { path: rootPath, elements: rootElements };
		} catch (error) {
			if (error instanceof RedirectError) {
				// We update the path to the new location
				path = Path.join('/', Path.relative(base, error.to));

				// Path.relative strips trailing slashes, which we do not want.
				// A redirect with trailing slash could be intentional
				if (error.to.endsWith('/')) {
					path = path + '/';
				}

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

function createRender(routes, path, context = {}) {
	if (context.base == undefined) context.base = '/';
	if (context.params == undefined) context.params = {};
	if (context.elements == undefined) context.elements = [];

	// We use null because an empty path could set previous to undefined, which is a valid value
	let match = null;
	let matched = false;
	let previous = null;
	let elements = [];

	for (let route of routes) {
		// Break if we encounter different path after having a match
		if (previous !== route.path) {
			if (matched) break;
			if (match) {
				match = null;
			}
		}

		if (match == undefined) {
			match = matcher(route.path, path, context.base);
		}

		if (match) {
			if (route.strict === false || match.strict === true) {
				matched = true;

				let splat = match.splat;
				let search = context.search;
				let params = { ...context.params, ...match.params };

				if (route.type === Redirect) {
					let targetPath = interpolate(route.to, match.params, match.splat, search);
					let targetBase = resolve(context.base, targetPath);
					throw new RedirectError(targetBase);
				}

				let contextElement = context.elements.find(e => e.props.route === route);

				// Recover the data resource of the previously rendered route. Try to reuse the same resource.
				// Prevent the same data to be fetched when the component is already mounted, by checking the previous rendered  params, splat and search
				// We can not use useMemo inside the Route element as it does not survive a suspend

				let resource;
				if (route.data && contextElement) {
					let dataFunctionIgnoresParams = route.data.length < 1;
					if (dataFunctionIgnoresParams || equalParams(contextElement.props.match.params, match.params)) {
						let dataFunctionIgnoresSplat = route.data.length < 2;
						if (dataFunctionIgnoresSplat || equalSplat(contextElement.props.match.splat, match.splat)) {
							let dataFunctionIgnoresSearch = route.data.length < 3;
							if (dataFunctionIgnoresSearch || equalSearch(contextElement.props.search, search)) {
								resource = contextElement.props.resource;
							}
						}
					}
				}

				// If the previous resource was not used, create a new one
				if (resource == undefined) {
					if (typeof route.data === 'function') {
						resource = createResource(Promise.resolve(route.data(params, splat, search)));
					} else if (route.data !== undefined) {
						resource = createResource(Promise.resolve(route.data));
					}
				}

				let key = routes.indexOf(route);
				let children;
				if (route.children) {
					children = createRender(route.children, match.path, {
						base: match.base,
						params,
						search,
						elements: contextElement?.props.children,
					});
				}

				// The key make sure that a different route element from the config is remounted
				// We pass the route, because we need the type to render the component
				// and the id of the route to render the parent
				// We pass the match because we need the older splat to compare with the new splat to see if we should be fetching again
				// We pass the params because the match params are not enough to compare for data fetching, as these are only the
				// params of the elements' path. The data fetching function could also need params from a parent element.
				// We also pass the search and resource for data fetching.
				elements.push(
					<Route key={key} route={route} match={match} params={params} search={search} resource={resource}>
						{children}
					</Route>,
				);
			}
		}

		previous = route.path;
	}

	return elements;
}

function equalParams(paramsA, paramsB) {
	if (paramsA == undefined) return false;
	if (paramsB == undefined) return false;

	let propsA = Object.getOwnPropertyNames(paramsA);
	let propsB = Object.getOwnPropertyNames(paramsB);

	if (propsA.length !== propsB.length) return false;

	return propsA.every(prop => paramsA[prop] === paramsB[prop]);
}

function equalSplat(splatA = [], splatB = []) {
	if (splatA === splatB) return true;
	if (splatA.length !== splatB.length) return false;

	for (let index = 0; index < splatA.length; ++index) {
		if (splatA[index] !== splatB[index]) {
			return false;
		}
	}

	return true;
}

function equalSearch(searchA = '', searchB = '') {
	return searchA === searchB;
}
