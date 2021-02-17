import Url from 'url';
import React from 'react';
import PendingContext from './contexts/pending.js';
import HistoryContext from './contexts/history.js';
import LocationContext from './contexts/location.js';

import { unstable_useTransition } from 'react';
import { useMemo, useState, useTransition, useLayoutEffect } from 'react';

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

		let locationReload = useImmutableCallback(function () {
			setElement(createRouteElement(routes, locationPath, { base }));
		});

		// Location is always the same object in the browser, but we create a new location object for every new location
		// making it more natural to use the location in the hook dependency array
		let location = useMemo(() => {
			let url = new URL(locationPath, rootLocation.origin);

			return {
				reload: locationReload,
				get href() {
					return url.href;
				},
				get hash() {
					return url.hash;
				},
				get host() {
					return url.host;
				},
				get port() {
					return url.port;
				},
				// read-only
				get origin() {
					return url.origin;
				},
				get search() {
					return url.search;
				},
				get protocol() {
					return url.protocol;
				},
				get password() {
					return url.password;
				},
				get username() {
					return url.username;
				},
				get pathname() {
					return url.pathname;
				},
				get hostname() {
					return url.hostname;
				},
				// read-only
				get searchParams() {
					return url.searchParams;
				},
			};
		}, [locationPath, locationReload]);

		let historyStateRef = useLatestRef(historyState);
		let historyLengthRef = useLatestRef(historyLength);
		let historyNavigate = useImmutableCallback(function (path, options = {}) {
			function executeNavigation() {
				setAction({ type: options.replace ? REPLACE : PUSH });
				if (options.state != undefined) setHistoryState(options.state);
				if (options.title != undefined) setDocumentTitle(options.title);

				if (path != undefined) {
					// Convert path to string just in case
					let target = Url.resolve(locationPath, `${path}`);
					if (target !== locationPath) {
						let context = { base, element };
						let routeElement = createRouteElement(routes, target, context);
						setElement(routeElement);
						setLocationPath(routeElement?.props.path ?? target);
					}
				}
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
					return historyStateRef.current;
				},
				get length() {
					return historyLengthRef.current;
				},
				get scrollRestoration() {
					return rootHistory.scrollRestoration;
				},
				set scrollRestoration(scroll) {
					rootHistory.scrollRestoration = scroll;
				},
			};
		}, [historyStateRef, historyLengthRef, historyNavigate]);

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
				rootHistory?.pushState?.(historyState, documentTitle, locationPath);
			} else if (action?.type === REPLACE) {
				rootHistory?.replaceState?.(historyState, documentTitle, locationPath);
			}
			setHistoryLength(rootHistory?.length);
		}, [action, historyState, documentTitle, locationPath]);

		// Do not render children before subscription to popstate event
		// as a child could navigate in its useEffect on mount, and this will
		// be executed before the popstate subscription effect

		// Maybe navigating in useEffect is bad practice and this is not needed?

		// This should only happen if the location was not given for server side rendering
		if (!mounted && options.location == undefined) return null;

		// The history value is a new object every render, as the history object does not change, but
		// the components using it should rerender, as the properties of the history object have changed
		return (
			<LocationContext.Provider value={location}>
				<HistoryContext.Provider value={{ history }}>
					<PendingContext.Provider value={pending}>{element}</PendingContext.Provider>
				</HistoryContext.Provider>
			</LocationContext.Provider>
		);
	};
}
