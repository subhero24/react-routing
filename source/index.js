import Path from 'path';
import React from 'react';
import PendingContext from './contexts/pending';
import HistoryContext from './contexts/history';
import LocationContext from './contexts/location';

import { useRef, useMemo, useState, useEffect, useTransition, useLayoutEffect } from 'react';

import preprocessRoutes from './utils/routes/preprocess';
import createRouteElement from './utils/routes/route-element';

const POP = 'POP';
const PUSH = 'PUSH';
const REPLACE = 'REPLACE';

// Mock useTransition to support versions without useTransition
let useCustomTransition = useTransition;
if (useCustomTransition == undefined) {
	useCustomTransition = function () {
		let pending = false;
		let transition = function (execute) {
			execute();
		};

		return [transition, pending];
	};
}

export default function Routes(...args) {
	let element;
	let routes = args.pop() ?? [];
	let options = args.pop() ?? {};

	let { path = window.location.pathname + window.location.search + window.location.hash, base = '/' } = options;

	routes = preprocessRoutes(routes);
	element = createRouteElement(routes, path, base);

	return function Router(props) {
		// TODO: Add other Suspense options like busyDelayMs, and busyMinDurationMs
		// when issues have been resolved
		// https://github.com/facebook/react/issues/18599
		// https://github.com/facebook/react/issues/18595
		let { timeoutMs = 4000 } = props;

		let [action, setAction] = useState();
		let [mounted, setMounted] = useState(false);
		let [transition, pending] = useCustomTransition({ timeoutMs });

		let [locationPath, setLocationPath] = useState(path);
		let [historyState, setHistoryState] = useState(window.history.state);
		let [historyLength, setHistoryLength] = useState(window.history.length);
		let [documentTitle, setDocumentTitle] = useState(window.document.title);

		let [routeElement, setRouteElement] = useState(element);

		let location = useMemo(() => {
			return new URL(locationPath, window.location.origin);
		}, [locationPath]);

		let history = useMemo(() => {
			return {
				go: function (delta) {
					window.history.go(delta);
				},
				back: function () {
					window.history.back();
				},
				forward: function () {
					window.history.forward();
				},
				pushState: function (state, title, path = '.') {
					this.navigate(path, { state, title, replace: false });
				},
				replaceState: function (state, title, path = '.') {
					this.navigate(path, { state, title, replace: true });
				},
				navigate: function (path, options = {}) {
					function executeNaviation() {
						setAction(options.replace ? REPLACE : PUSH);
						if (options.state != undefined) setHistoryState(options.state);
						if (options.title != undefined) setDocumentTitle(options.title);

						let target = Path.resolve(locationPath, `${path}`);
						if (target !== locationPath) {
							setLocationPath(target);
							setRouteElement(createRouteElement(routes, target, base));
						}
					}

					if (options.sticky) {
						transition(executeNaviation);
					} else {
						executeNaviation();
					}
				},
				get state() {
					return historyState;
				},
				get length() {
					return historyLength;
				},
				get scrollRestoration() {
					return window.history.scrollRestoration;
				},
				set scrollRestoration(scroll) {
					window.history.scrollRestoration = scroll;
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
				setHistoryState(window.history.state);
				setHistoryLength(window.history.length);
				setDocumentTitle(window.document.title);

				let path = window.location.pathname + window.location.search + window.location.hash;
				if (path !== locationPathRef.current) {
					setLocationPath(path);
					setRouteElement(createRouteElement(routes, path, '/'));
				}
			}

			setMounted(true);
			addEventListener('popstate', handler);
			return function () {
				removeEventListener('popstate', handler);
			};
		}, []);

		// Update history length state because we could not know it in advance
		// as a popstate could be fired to a history item in the middle of the stack
		useLayoutEffect(() => {
			setHistoryLength(window.history.length);
		}, [setHistoryLength]);

		// If component did render with updated location/history, update the browsers history
		useLayoutEffect(() => {
			if (action === PUSH) {
				window.history.pushState(historyState, documentTitle, locationPath);
			} else if (action === REPLACE) {
				window.history.replaceState(historyState, documentTitle, locationPath);
			}
		}, [action, historyState, documentTitle, locationPath]);

		// Do not render children before subscription to popstate event
		// as a child could navigate in its useEffect on mount, and this will
		// be executed before the popstate subscription effect
		if (!mounted) return null;

		return (
			<LocationContext.Provider value={location}>
				<HistoryContext.Provider value={history}>
					<PendingContext.Provider value={pending}>{element}</PendingContext.Provider>
				</HistoryContext.Provider>
			</LocationContext.Provider>
		);
	};
}
