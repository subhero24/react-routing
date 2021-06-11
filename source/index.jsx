import Url from 'url';
import React from 'react';
import PendingContext from './contexts/pending';
import HistoryContext from './contexts/history';
import LocationContext from './contexts/location';

import { useMemo, useState, useLayoutEffect, Suspense } from 'react';

import useData from './hooks/use-data.js';
import useMounted from './hooks/use-mounted.js';
import useForceUpdate from './hooks/use-force-update.js';
import useEventListener from './hooks/use-event-listener.js';
import useImmutableCallback from './hooks/use-immutable-callback.js';

import sleep from './utils/sleep.js';
import traverse from './utils/traverse.js';
import createRender from './utils/create-render.jsx';
import createRoutes from './utils/create-routes.js';
import locationToPath from './utils/paths/location-to-path.js';
import createResource from './utils/create-resource';

const PUSH = 'PUSH';
const REPLACE = 'REPLACE';

// Mock startTransition to support React versions without startTransition
let startTransition =
	React.startTransition ??
	function startTransition(execute) {
		console.warn(
			'React startTransition is not defined. Falling back to transitions without sticky navigation. Please use a version of React that supports transitions to do sticky navigations.',
		);
		execute();
	};

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
			maxTransitionTimeout = 5000,
			pendingAfter = 100,
			pendingMinimum = 500,
			fallback = null,
		} = props;

		let update = useForceUpdate();
		let mounted = useMounted();
		let [render, setRender] = useState(initialRender);
		let [action, setAction] = useState({
			type: REPLACE,
			path: render.path,
			state: rootHistory?.state,
			title: rootDocument?.title,
		});
		let [pending, setPending] = useState(false);
		let [resource, setResource] = useState();

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
		let historyNavigate = useImmutableCallback(function (path, options = {}) {
			startTransition(function () {
				let navigate = {
					type: options.replace ? REPLACE : PUSH,
					path: action.path,
					state: options.state ?? action.state,
					title: options.title ?? action.title,
				};

				if (path != undefined) {
					let target = Url.resolve(action.path, `${path}`);
					if (target !== action.path) {
						let resource;
						let rerender = createRender(routes, target, { base, elements: render.elements });
						let rerenderPath = rerender.path ?? target;

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
							console.log('transitioning immediately');
						}

						if (transitionTimeout > 0) {
							let done = false;
							let pendingPromise;

							if (transitionTimeout > pendingAfter) {
								console.log('setting spinner to fire within', pendingAfter);
								setTimeout(function () {
									if (done === false) {
										pendingPromise = sleep(pendingMinimum);
										setPending(true);
										console.log('still busy, so activating spinner and setting pendingPromise');
									} else {
										console.log('done, so no need to activate spinner');
									}
								}, pendingAfter);
							}

							resource = createResource(
								new Promise(resolve => {
									let transitionTimer;

									async function transition() {
										if (transitionTimer) {
											clearTimeout(transitionTimer);
											transitionTimer = undefined;

											// Wait for the pending spinner on the previous screen
											if (pendingPromise) await pendingPromise;

											// Extend the still suspended resources with the pendingMinimum
											traverse(rerender.elements, function (element) {
												let resource = element.props.resource;
												if (resource?.status === 'busy') {
													resource.promise = sleep(pendingMinimum).then(resource.promise);
												}
											});

											resolve();
										}
									}

									// Schedule the transition if data is not yet ready
									if (transitionTimeout !== Infinity) {
										console.log('scheduling automated transition in', transitionTimeout);
										transitionTimer = setTimeout(function () {
											console.log('data is not yet ready, but transitioning anyway');
											transition();
										}, transitionTimeout);
									}

									let promises = [];
									traverse(rerender.elements, function (element) {
										if (element.props.resource) {
											promises.push(element.props.resource.promise);
										}
									});

									// Start transition if all data is in
									Promise.all(promises).then(() => {
										console.log('all data has arrived');
										if (transitionTimer) {
											console.log('starting the transition');
											transition();
										} else {
											console.log(
												'do nothing because transition was already fired because of timeout',
											);
										}
									});
								}),
							);
						}

						setRender(rerender);
						setResource(resource);

						navigate.path = rerenderPath;
					}
				}

				setAction(navigate);
			});
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
					<PendingContext.Provider value={pending}>
						{/* The suspender is necessary because we need to suspend relative to an already mounted Suspense component */}
						{/* Otherwise the fallback of the newly mounted suspense boundary will trigger immediately */}
						<Suspender resource={resource} />
						{/* This suspense boundary is needed to allow non-sticky navigation to a component which does not render a suspense boundary itself */}
						{/* Because of how react transitions work, it will do the transition in the background even thought the navigation is non-sticky */}
						<Suspense key={render.path} fallback={fallback}>
							{render.elements}
						</Suspense>
					</PendingContext.Provider>
				</HistoryContext.Provider>
			</LocationContext.Provider>
		);
	};
}

function Suspender(props) {
	useData(props.resource);

	return null;
}
