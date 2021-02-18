import React from 'react';
import Url from './libs/url.js';
import PendingContext from './contexts/pending';
import HistoryContext from './contexts/history';
import LocationContext from './contexts/location';

import { useMemo, useState, useTransition, useLayoutEffect } from 'react';
import { unstable_useTransition } from 'react';

import useMounted from './hooks/use-mounted.js';
import useLatestRef from './hooks/use-latest-ref.js';
import useEventListener from './hooks/use-event-listener.js';
import useImmutableCallback from './hooks/use-immutable-callback.js';

import calculatePath from './utils/paths/calculate-path.js';
import preprocessRoutes from './utils/routes/preprocess.js';
import createRouteElement from './utils/routes/create-route-element.jsx';

const PUSH = 'PUSH';
const REPLACE = 'REPLACE';

// Mock useTransition to support React versions without useTransition
let useIsomorphicTransition = unstable_useTransition ?? useTransition;
if (useIsomorphicTransition == undefined) {
	console.warn(
		'React useTransition is not defined. Falling back to transitions without Suspense. Please use a version of React that supports transitions to do sticky navigations.',
	);
	useIsomorphicTransition = function () {
		let pending = false;
		let transition = function (execute) {
			execute();
		};

		return [transition, pending];
	};
}

export default function Routes(routes, options = {}) {
	let { location, history, document, base = '/' } = options;

	let rootWindow;
	try {
		rootWindow = window;
	} catch (error) {
		let isReferenceError = error instanceof ReferenceError;
		if (!isReferenceError) throw error;
	}

	let rootLocation;
	if (location != undefined) {
		if (typeof location === 'string') {
			try {
				rootLocation = new URL(location);
			} catch (error) {
				try {
					rootLocation = new URL(location, 'http://localhost/');
				} catch (localhostError) {
					throw error;
				}
			}
		} else {
			rootLocation = location;
		}
	} else if (rootWindow?.location != undefined) {
		rootLocation = rootWindow.location;
	} else {
		throw new Error(`React-sprout did not find a location. Please specify a location in the react-sprout options.`);
	}

	// Create a rootHistory to be used in the component
	// Defaults to the browser's history
	let rootHistory;
	if (history != undefined) {
		rootHistory = history;
	} else if (rootWindow?.history != undefined) {
		rootHistory = rootWindow.history;
	}

	// Create a rootDocument to be used in the component
	// Defaults to the browser's document
	let rootDocument;
	if (document != undefined) {
		rootDocument = document;
	} else if (rootWindow?.document != undefined) {
		rootDocument = rootWindow.document;
	}

	routes = preprocessRoutes(routes);
	let path = calculatePath(rootLocation);
	let routeElement = createRouteElement(routes, path, { base });

	return function Router(props) {
		// TODO: Add other Suspense options like busyDelayMs, and busyMinDurationMs
		// when issues have been resolved
		// https://github.com/facebook/react/issues/18599
		// https://github.com/facebook/react/issues/18595

		let { timeoutMs = 4000 } = props;

		let mounted = useMounted();
		let [element, setElement] = useState(routeElement);
		let [transition, pending] = useIsomorphicTransition({ timeoutMs });

		let [action, setAction] = useState();
		let [locationPath, setLocationPath] = useState(routeElement?.props.path);
		let [historyState, setHistoryState] = useState(rootHistory?.state);
		let [historyLength, setHistoryLength] = useState(rootHistory?.length);
		let [documentTitle, setDocumentTitle] = useState(rootDocument?.title);

		let elementRef = useLatestRef(element);
		let locationPathRef = useLatestRef(locationPath);

		let location = useMemo(() => {
			let result = new URL(locationPath, rootLocation.origin);

			// Could not figure out a way to copy the properties of the above URL object to my own object,
			// as all the properties are defined on its prototype. So instead of returning another object
			// with the same props, we will add the location functions like "reload" to result, and return that.
			result.reload = function (force) {
				let context = force ? { base } : { base, element: elementRef.current };
				let routeElement = createRouteElement(routes, locationPath, context);
				setElement(routeElement);
			};

			return result;
		}, [locationPath, elementRef]);

		let historyNavigate = useImmutableCallback(function (path, options = {}) {
			function executeNavigation() {
				let navigationPath;

				if (options.state != undefined) setHistoryState(options.state);
				if (options.title != undefined) setDocumentTitle(options.title);

				if (path != undefined) {
					let target = Url.resolve(locationPath, `${path}`);
					if (target !== locationPath) {
						let context = { base, element };
						let routeElement = createRouteElement(routes, target, context);

						navigationPath = routeElement?.props.path ?? target;

						setElement(routeElement);
						setLocationPath(navigationPath);
					}
				}

				setAction({
					type: options.replace ? REPLACE : PUSH,
					path: navigationPath,
					state: options.state ?? historyState,
					title: options.title ?? documentTitle,
				});
			}

			if (options.sticky) {
				transition(executeNavigation);
			} else {
				executeNavigation();
			}
		});

		let history = useMemo(() => {
			return {
				go: function (delta) {
					rootHistory.go(delta);
				},
				back: function () {
					rootHistory.back();
				},
				forward: function () {
					rootHistory.forward();
				},
				pushState: function (state, title, path) {
					this.navigate(path, { state, title, replace: false });
				},
				replaceState: function (state, title, path) {
					this.navigate(path, { state, title, replace: true });
				},
				navigate: historyNavigate,
				get state() {
					return historyState;
				},
				get length() {
					return historyLength;
				},
				get scrollRestoration() {
					return rootHistory.scrollRestoration;
				},
				set scrollRestoration(scroll) {
					rootHistory.scrollRestoration = scroll;
				},
			};
		}, [historyLength, historyState, transition, elementRef, locationPathRef]);

		useEventListener(rootWindow, 'popstate', function () {
			setHistoryState(rootHistory?.state);
			setHistoryLength(rootHistory?.length);
			setDocumentTitle(rootDocument?.title);

			let path = calculatePath(rootLocation);
			if (path !== locationPath) {
				let routeElement = createRouteElement(routes, path, { base: '/', element });
				setElement(routeElement);
				setLocationPath(routeElement?.props.path ?? path);
			}
		});

		// If component did render with updated location/history, update the browsers history
		useLayoutEffect(() => {
			if (action?.type === PUSH) {
				rootHistory?.pushState?.(action.state, action.title, action.path);
			} else if (action?.type === REPLACE) {
				rootHistory?.replaceState?.(action.state, action.title, action.path);
			}
			setHistoryLength(rootHistory?.length);
		}, [action]);

		// Do not render children before subscription to popstate event
		// as a child could navigate in its useEffect on mount, and this will
		// be executed before the popstate subscription effect

		// Maybe navigating in useEffect is bad practice and this is not needed?

		// This should only happen if the location was not given for server side rendering
		if (!mounted && options.location == undefined) return null;

		return (
			<LocationContext.Provider value={location}>
				<HistoryContext.Provider value={history}>
					<PendingContext.Provider value={pending}>{element}</PendingContext.Provider>
				</HistoryContext.Provider>
			</LocationContext.Provider>
		);
	};
}
