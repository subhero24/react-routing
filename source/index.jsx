import Url from 'url';
import React from 'react';
import PendingContext from './contexts/pending';
import HistoryContext from './contexts/history';
import LocationContext from './contexts/location';

import { useRef, useMemo, useState, useLayoutEffect, Fragment } from 'react';

import useMounted from './hooks/use-mounted.js';
import useForceUpdate from './hooks/use-force-update.js';
import useEventListener from './hooks/use-event-listener.js';
import useImmutableCallback from './hooks/use-immutable-callback.js';

import wait from './utils/promise/wait.js';
import sleep from './utils/promise/sleep.js';
import extend from './utils/promise/extend.js';
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

	return function Router(props) {
		let { minTransitionTimeout = 50, maxTransitionTimeout = 4000, minPending = 500, delayPending = 100 } = props;

		let update = useForceUpdate();
		let mounted = useMounted();

		let [render, setRender] = useState(() => {
			let render = createRender(routes, path, { base });
			extend(render.elements, minPending);
			return render;
		});

		let [action, setAction] = useState({
			type: REPLACE,
			path: render.path,
			state: rootHistory?.state,
			title: rootDocument?.title,
		});

		let transition = useRef({ path: null, paths: [] });
		let [pending, setPending] = useState(false);

		// Everything related to location object
		let url = useMemo(() => new URL(action.path, rootLocation.origin), [action.path]);
		let locationUrl = useImmutableCallback(() => url);
		let locationReload = useImmutableCallback(() => {
			let render = createRender(routes, action.path, { base });
			extend(render.elements, minPending);
			setRender(render);
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
			if (target === action.path) {
				setAction(navigate);
				setPending(false);
				transition.current.path = null;
			} else {
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
					extend(rerender.elements, minPending);
					setRender(rerender);
					setAction(navigate);
					transition.current.path = null;
				} else {
					let transitioning = transition.current.paths.indexOf(target) !== -1;
					if (transitioning === false) {
						transition.current.path = target;
						transition.current.paths.push(target);

						let delay;
						let finished = false;

						if (transitionTimeout > delayPending) {
							sleep(delayPending).then(spin);
						}

						let transitionByData = wait(rerender.elements);
						let transitionByTimeout = sleep(transitionTimeout);

						Promise.race([transitionByData, transitionByTimeout]).then(execute);

						function spin() {
							if (finished === false) {
								setPending(true);
								delay = sleep(minPending);
							}
						}

						async function execute() {
							finished = true;

							if (delay) await delay;
							if (target === transition.current.path) {
								extend(rerender.elements, minPending);

								setRender(rerender);
								setAction(navigate);
								setPending(false);

								transition.current.path = null;
							}

							transition.current.paths = transition.current.paths.filter(path => path !== target);
						}
					}
				}
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

				extend(rerender.elements, minPending);

				traverse(rerender.elements, function (element) {
					let resource = element.props.resource;
					if (resource?.status === 'busy') {
						resource.promise = sleep(minPending).then(resource.promise);
					}
				});

				setRender(rerender);
			}

			setAction(navigate);
		});

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
