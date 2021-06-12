import Url from 'url';
import React from 'react';
import PendingContext from './contexts/pending';
import HistoryContext from './contexts/history';
import LocationContext from './contexts/location';

import { useRef, useMemo, useState, useLayoutEffect } from 'react';

import useMounted from './hooks/use-mounted.js';
import useForceUpdate from './hooks/use-force-update.js';
import useEventListener from './hooks/use-event-listener.js';
import useImmutableCallback from './hooks/use-immutable-callback.js';

import wait from './utils/wait.js';
import sleep from './utils/sleep.js';
import traverse from './utils/traverse.js';
import createRender from './utils/create-render.jsx';
import createRoutes from './utils/create-routes.js';
import locationToPath from './utils/paths/location-to-path.js';

const PUSH = 'PUSH';
const REPLACE = 'REPLACE';

export default function Routes(config, options = {}) {
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

	let path = locationToPath(rootLocation);
	let routes = createRoutes(config);

	function initialRender() {
		return createRender(routes, path, { base });
	}

	return function Router(props) {
		let {
			minTransitionTimeout = 50,
			maxTransitionTimeout = 4000,
			pendingDelay = 100,
			pendingMinimum = 500,
		} = props;

		let update = useForceUpdate();
		let mounted = useMounted();
		let targets = useRef([]);
		let [render, setRender] = useState(initialRender);
		let [action, setAction] = useState({
			type: REPLACE,
			path: render.path,
			state: rootHistory?.state,
			title: rootDocument?.title,
		});
		let [pending, setPending] = useState(false);

		// Everything related to location object
		let url = useMemo(() => new URL(action.path, rootLocation.origin), [action.path]);
		let locationUrl = useImmutableCallback(() => url);
		let locationReload = useImmutableCallback(() => {
			setRender(createRender(routes, action.path, { base }));
		});

		let location = useMemo(() => {
			return {
				reload: locationReload,
				get href() {
					return locationUrl().href;
				},
				get hash() {
					return locationUrl().hash;
				},
				get host() {
					return locationUrl().host;
				},
				get port() {
					return locationUrl().port;
				},
				// read-only
				get origin() {
					return locationUrl().origin;
				},
				get search() {
					return locationUrl().search;
				},
				get protocol() {
					return locationUrl().protocol;
				},
				get password() {
					return locationUrl().password;
				},
				get username() {
					return locationUrl().username;
				},
				get pathname() {
					return locationUrl().pathname;
				},
				get hostname() {
					return locationUrl().hostname;
				},
				get searchParams() {
					return locationUrl().searchParams;
				},
			};
		}, [locationUrl, locationReload]);

		// Everything related to the history object
		let historyState = useImmutableCallback(() => action.state);
		let historyNavigate = useImmutableCallback(async function (path, options = {}) {
			let navigate = {
				type: options.replace ? REPLACE : PUSH,
				path: action.path,
				state: options.state ?? action.state,
				title: options.title ?? action.title,
			};

			let target = path == undefined ? action.path : Url.resolve(action.path, `${path}`);
			let transitioning = targets.current.includes(target);

			// We keep an array of paths where we are transitioning to, so that we can skip
			// transitions already in progress, and we can apply only the latest transition
			targets.current.push(target);

			if (target !== action.path) {
				if (transitioning === false) {
					let rerender = createRender(routes, target, { base, elements: render.elements });

					navigate.path = rerender.path;

					let transitionTimeout;
					if (options.sticky === true) {
						transitionTimeout = maxTransitionTimeout;
					} else if (options.sticky == undefined) {
						transitionTimeout = minTransitionTimeout;
					} else if (options.sticky == false) {
						transitionTimeout = 0;
					} else {
						transitionTimeout = options.sticky;
					}

					if (transitionTimeout === 0) {
						setRender(rerender);
					} else {
						let finished;
						let pendingTimer;
						let spinningDelay;
						let transitionTimer;

						wait(rerender.elements).then(transition);

						if (transitionTimeout > pendingDelay) {
							pendingTimer = setTimeout(function () {
								if (!finished) {
									setPending(true);
									spinningDelay = sleep(pendingMinimum);
								}
							}, pendingDelay);
						}

						if (transitionTimeout !== Infinity) {
							transitionTimer = setTimeout(transition, transitionTimeout);
						}

						async function transition() {
							if (finished) return;

							finished = true;
							clearTimeout(pendingTimer);
							clearTimeout(transitionTimer);

							if (spinningDelay) await spinningDelay;

							let currentTarget = targets.current[targets.current.length - 1];
							if (currentTarget === target) {
								targets.current = [];

								traverse(rerender.elements, function (element) {
									let resource = element.props.resource;
									if (resource?.status === 'busy') {
										resource.promise = sleep(pendingMinimum);
									}
								});

								setRender(rerender);
							}
						}
					}
				}
			}

			setAction(navigate);
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
					return historyState();
				},
				get length() {
					return rootHistory.length;
				},
				get scrollRestoration() {
					return rootHistory.scrollRestoration;
				},
				set scrollRestoration(scroll) {
					rootHistory.scrollRestoration = scroll;
				},
			};
		}, [historyNavigate, historyState]);

		// Subscribe to popstate events and update state accordingly
		useEventListener(rootWindow, 'popstate', function () {
			let path = locationToPath(rootLocation);
			let navigate = {
				path: path,
				state: rootHistory?.state,
				title: rootDocument?.title,
			};
			if (path !== render.path) {
				let rerender = createRender(routes, path, { base: '/', elements: render.elements });
				if (rerender.path !== path) {
					navigate.type = REPLACE;
					navigate.path = rerender.path;
				}

				setRender(rerender);
			}

			setAction(navigate);
		});

		// When the new view is rendered, we set pending to false
		// We could also do this before resolving the transition promise, but
		// that introduces a glitsch, as the pending is set to false and the rendering
		// of the new view could still take a while
		useLayoutEffect(() => {
			setPending(false);
		}, [render]);

		// Update the real history after a component was rendered after a navigation
		// We do this in a layouteffect because we need to rerender immediately because
		// history.length could have changed
		useLayoutEffect(() => {
			if (action == undefined) return;

			if (action.type === REPLACE) {
				rootHistory?.replaceState?.(action.state, action.title, action.path);
			} else if (action.type === PUSH) {
				rootHistory?.pushState?.(action.state, action.title, action.path);

				// Rerender immediately in case history.length has changed
				update();
			}
		}, [action]);

		// We create a new location/history when url/history.length changes, to update all
		// components that depend on it, even if the location/history itself does not change
		let locationContextValue = useMemo(() => ({ location }), [url]);
		let historyContextValue = useMemo(() => ({ history }), [rootHistory?.length, action?.state]);

		// Do not render children before subscription to popstate event
		// as a child could navigate in its useEffect on mount, and this will
		// be executed before the popstate subscription effect

		// This could not occur when the location is fixed, for example in SSR
		if (!mounted && options.location == undefined) return null;

		return (
			<LocationContext.Provider value={locationContextValue}>
				<HistoryContext.Provider value={historyContextValue}>
					<PendingContext.Provider value={pending}>{render.elements}</PendingContext.Provider>
				</HistoryContext.Provider>
			</LocationContext.Provider>
		);
	};
}
