import React from 'react';
import Redirect from '../../components/redirect';
import ChildContext from '../../contexts/child';
import SplatContext from '../../contexts/splat';
import ParamsContext from '../../contexts/params';
import ResourceContext from '../../contexts/resource';

import stripHash from '../paths/strip-hash';
import interpolate from '../paths/interpolate-path';
import createResource from '../create-resource';

import { join, relative } from 'path';

function Route(props) {
	let { params, splat, resource, render: RenderComponent, props: renderProps, children } = props;

	// The ChildContext is used for the <Child /> component, to know what children to render.
	// So we set children on context, even though they are passed as the children of Component.

	// There are a lot of contexts provider per route, but as they can change independently,
	// making a context provider with one value is not desirable

	return (
		<ResourceContext.Provider value={resource}>
			<ParamsContext.Provider value={params}>
				<SplatContext.Provider value={splat}>
					<ChildContext.Provider value={children}>
						<RenderComponent {...renderProps}>{children}</RenderComponent>
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

export default function createRootRouteElement(routes, path, { base = '/', element = null }) {
	// When redirected to a new url, we should check to see if the url was already encountered before,
	// as to prevent an infinite loop in redirects. So we keep an array of all visited paths, to prevent this.
	// With this we can also improve error reporting, as we can specify how the infinite loop of redirects came to be.
	let redirects = [path];

	while (true) {
		try {
			return createRouteElement(routes, path, { base, element });
		} catch (error) {
			if (error instanceof RedirectError) {
				// We update the path to the new location
				path = join('/', relative(base, error.to));

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

function createRouteElement(routes, path, context = {}) {
	if (context.base == undefined) context.base = '/';
	if (context.params == undefined) context.params = {};
	if (context.element == undefined) context.element = null;

	for (let route of routes) {
		let strict = route.routes == undefined;
		let match = route.path(stripHash(path), context.base, strict);

		if (match) {
			let pathname = join(context.base, path);
			let matched = pathname.slice(0, match.length);
			let unmatched = pathname.slice(match.length);

			let props = {};
			let splat = match.splat;
			let params = { ...context.params, ...match.params };

			let render = route.render;
			if (render === Redirect) {
				let targetPath = interpolate(route.redirect, params, splat);
				let targetBase = join(context.base, targetPath);
				throw new RedirectError(targetBase);
			}

			let data = route.data;
			// Prevent the same data to be fetched when the component is already mounted,
			// by checking the previous rendered element's data, params and splat
			// We can not use useMemo inside the Route element as it does not survive a suspend
			let resource;
			let isSameComponent = context.element?.props.render === render;
			if (isSameComponent) {
				let isSameDataFn = context.element.props.data == data;
				if (isSameDataFn) {
					let isSameParams = equalParams(context.element.props.params, params);
					if (isSameParams) {
						let isSameSplat = equalSplat(context.element.props.splat, splat);
						if (isSameSplat) {
							resource = context.element.props.resource;
						}
					}
				}
			}

			if (resource == undefined) {
				if (typeof data === 'function') {
					resource = createResource(data(params, splat));
				} else if (data !== undefined) {
					resource = createResource(Promise.resolve(data));
				}
			}

			let childPath = unmatched;
			let childBase = join(context.base, matched);
			let childParams = params;
			let childRoutes = route.routes;
			let childElement = context.element?.props.children;
			let childContext = {
				base: childBase,
				params: childParams,
				element: childElement,
			};

			let childRoute = childRoutes ? createRouteElement(childRoutes, childPath, childContext) : undefined;

			// We need the data prop even though we don't use it in render, but we need it to compare
			// in the next createRouteElement with the new data function to prevent fetching the data again
			let element = (
				<Route
					path={path}
					params={params}
					splat={splat}
					data={data}
					resource={resource}
					render={render}
					props={props}
				>
					{childRoute}
				</Route>
			);

			return element;
		}
	}

	return null;
}

function equalParams(paramsA, paramsB) {
	let propsA = Object.getOwnPropertyNames(paramsA);
	let propsB = Object.getOwnPropertyNames(paramsB);

	if (propsA.length !== propsB.length) return false;

	return propsA.every(prop => paramsA[prop] === paramsB[prop]);
}

function equalSplat(splatA, splatB) {
	if (splatA.length !== splatB.length) return false;

	for (let index = 0; index < splatA.length; ++index) {
		if (splatA[index] !== splatB[index]) {
			return false;
		}
	}

	return true;
}
