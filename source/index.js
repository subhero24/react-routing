import Path from 'path';
import React from 'react';
import PendingContext from './contexts/pending';
import HistoryContext from './contexts/history';
import LocationContext from './contexts/location';

import { useRef, useMemo, useState, useEffect, useTransition as useReactTransition, useLayoutEffect } from 'react';

import createRoute from './utils/routes/create-route';
import calculatePath from './utils/paths/calculate-path';
import preprocessRoutes from './utils/routes/preprocess';

const POP = 'POP';
const PUSH = 'PUSH';
const REPLACE = 'REPLACE';

// Mock useTransition to support React versions without useTransition
let useTransition = useReactTransition;
if (useTransition == undefined) {
	useTransition = function () {
		let pending = false;
		let transition = function (execute) {
			execute();
		};

		return [transition, pending];
	};
}

export default function Routes(...args) {
	let routes = args.pop() ?? [];
	let options = args.pop() ?? {};

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
					rootLocation = new URL(Path.join('http://localhost/', location));
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
	let route = createRoute(routes, path, base);

	return function Router(props) {
		// TODO: Add other Suspense options like busyDelayMs, and busyMinDurationMs
		// when issues have been resolved
		// https://github.com/facebook/react/issues/18599
		// https://github.com/facebook/react/issues/18595
		let { timeoutMs = 4000 } = props;

		let [action, setAction] = useState(REPLACE);
		let [mounted, setMounted] = useState(false);
		let [transition, pending] = useTransition({ timeoutMs });
		let [routeElement, setRouteElement] = useState(route.element);

		let [locationPath, setLocationPath] = useState(route.path);
		let [historyState, setHistoryState] = useState(rootHistory?.state);
		let [historyLength, setHistoryLength] = useState(rootHistory?.length);
		let [documentTitle, setDocumentTitle] = useState(rootDocument?.title);

		let location = useMemo(() => {
			let result = new URL(locationPath, rootLocation.origin);

			// Could not figure out a way to copy the properties of the above URL object to my own object,
			// as all the properties are defined on its prototype. So instead of returning another object
			// with the same props, we will add the location functions to result, and return result.
			result.reload = function (force) {
				if (force) {
					if (rootLocation?.reload) rootLocation.reload(true);
				} else {
					let route = createRoute(routes, locationPath, base);
					setAction(REPLACE);
					setLocationPath(route.path);
					setRouteElement(route.element);
				}
			};

			return result;
		}, [locationPath]);

		let history = useMemo(() => {
			return {
				go: function (delta) {
					if (!rootHistory && process.env.NODE_ENV === 'development') {
						console.warn(
							`History.go can not be executed without a history. Please specify a history in the react-sprout options.`,
						);
					} else if (rootHistory) {
						rootHistory?.go(delta);
					}
				},
				back: function () {
					if (!rootHistory && process.env.NODE_ENV === 'development') {
						console.warn(
							`History.back can not be executed without a history. Please specify a history in the react-sprout options.`,
						);
					} else if (rootHistory) {
						rootHistory?.back();
					}
				},
				forward: function () {
					if (!rootHistory && process.env.NODE_ENV === 'development') {
						console.warn(
							`History.forward can not be executed without a history. Please specify a history in the react-sprout options.`,
						);
					} else if (rootHistory) {
						rootHistory.forward();
					}
				},
				pushState: function (state, title, path = '.') {
					this.navigate(path, { state, title, replace: false });
				},
				replaceState: function (state, title, path = '.') {
					this.navigate(path, { state, title, replace: true });
				},
				navigate: function (path, options = {}) {
					function executeNavigation() {
						setAction(options.replace ? REPLACE : PUSH);
						if (options.state != undefined) setHistoryState(options.state);
						if (options.title != undefined) setDocumentTitle(options.title);

						let target = Path.resolve(locationPath, `${path}`);
						if (target !== locationPath) {
							let route = createRoute(routes, target, base);
							setLocationPath(route.path);
							setRouteElement(route.element);
						}
					}

					if (options.sticky) {
						transition(executeNavigation);
					} else {
						executeNavigation();
					}
				},
				get state() {
					return historyState;
				},
				get length() {
					return historyLength;
				},
				get scrollRestoration() {
					if (!rootHistory && process.env.NODE_ENV === 'development') {
						console.warn(
							`History.scrollRestoration is not available without a history. Please specify a history in the react-sprout options.`,
						);
					} else if (rootHistory) {
						return rootHistory.scrollRestoration;
					}
					return false;
				},
				set scrollRestoration(scroll) {
					if (!rootHistory && process.env.NODE_ENV === 'development') {
						console.warn(
							`History.scrollRestoration is not available without a history. Please specify a history in the react-sprout options.`,
						);
					} else if (rootHistory) {
						rootHistory.scrollRestoration = scroll;
					}
				},
			};
		}, [locationPath, historyLength, historyState, transition]);

		// Latest location is needed in popstate handler, which we only want to add as an event listener once
		let locationPathRef = useRef();
		useEffect(() => {
			locationPathRef.current = locationPath;
		});

		// Subscribe to popstate events
		useEffect(() => {
			function handler() {
				setAction(POP);
				setHistoryState(rootHistory?.state);
				setHistoryLength(rootHistory?.length);
				setDocumentTitle(rootDocument?.title);

				let path = calculatePath(rootLocation);
				if (path !== locationPathRef.current) {
					let route = createRoute(routes, path, '/');
					setLocationPath(route.path);
					setRouteElement(route.element);
				}
			}

			setMounted(true);
			rootWindow?.addEventListener?.('popstate', handler);
			return function () {
				rootWindow?.removeEventListener?.('popstate', handler);
			};
		}, []);

		// Update history length state because we could not know it in advance
		// as a popstate could be fired to a history item in the middle of the stack
		useLayoutEffect(() => {
			setHistoryLength(rootHistory?.length);
		}, [setHistoryLength]);

		// If component did render with updated location/history, update the browsers history
		useLayoutEffect(() => {
			if (action === PUSH) {
				rootHistory?.pushState?.(historyState, documentTitle, locationPath);
			} else if (action === REPLACE) {
				rootHistory?.replaceState?.(historyState, documentTitle, locationPath);
			}
		}, [action, historyState, documentTitle, locationPath]);

		// Do not render children before subscription to popstate event
		// as a child could navigate in its useEffect on mount, and this will
		// be executed before the popstate subscription effect
		if (!mounted) return null;

		return (
			<LocationContext.Provider value={location}>
				<HistoryContext.Provider value={history}>
					<PendingContext.Provider value={pending}>{routeElement}</PendingContext.Provider>
				</HistoryContext.Provider>
			</LocationContext.Provider>
		);
	};
}
