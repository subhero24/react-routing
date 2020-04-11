import Path from 'path';
import React from 'react';
import PendingContext from './contexts/pending';
import HistoryContext from './contexts/history';
import LocationContext from './contexts/location';

import { useRef, useMemo, useState, useEffect, useTransition, useLayoutEffect } from 'react';

import preprocessRoutes from './utils/routes/preprocess';
import createRouteComponent from './utils/routes/route-component';

const POP = 'POP';
const PUSH = 'PUSH';
const REPLACE = 'REPLACE';

export default function Routes(...args) {
	let routes = args.pop() ?? [];
	let options = args.pop() ?? {};
	let component;

	let { path = window.location.pathname + window.location.search + window.location.hash, base = '/' } = options;

	routes = preprocessRoutes(routes);
	component = createRouteComponent(routes, path, base);

	return function Router(props) {
		let { timeoutMs = 4000 } = props;

		let [action, setAction] = useState();
		let [mounted, setMounted] = useState(false);
		let [transition, pending] = useTransition({ timeoutMs });

		let [locationPath, setLocationPath] = useState(path);
		let [historyState, setHistoryState] = useState(window.history.state);
		let [historyLength, setHistoryLength] = useState(window.history.length);
		let [documentTitle, setDocumentTitle] = useState(window.document.title);

		// The Component useState and subsequent SetComponents needs to do set the state
		// with a function, because the component itself could be a function component
		let [Component, setComponent] = useState(() => component);

		let location = useMemo(() => {
			return new URL(locationPath, window.location.origin);
		}, [locationPath]);

		let history = useMemo(() => {
			return {
				go: function(delta) {
					window.history.go(delta);
				},
				back: function() {
					window.history.back();
				},
				forward: function() {
					window.history.forward();
				},
				pushState: function(state, title, path = '.') {
					this.navigate(`${path}`, { state, title, replace: false });
				},
				replaceState: function(state, title, path = '.') {
					this.navigate(`${path}`, { state, title, replace: true });
				},
				navigate: function(path, options = {}) {
					transition(function() {
						setAction(options.replace ? REPLACE : PUSH);
						if (options.state != undefined) setHistoryState(options.state);
						if (options.title != undefined) setDocumentTitle(options.title);

						let target = Path.resolve(locationPath, `${path}`);
						if (target !== locationPath) {
							let component = createRouteComponent(routes, target, base);
							setComponent(() => component);
							setLocationPath(target);
						}
					});
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
					let component = createRouteComponent(routes, path, '/');
					setComponent(() => component);
					setLocationPath(path);
				}
			}

			setMounted(true);
			addEventListener('popstate', handler);
			return function() {
				removeEventListener('popstate', handler);
			};
		}, []);

		// Update history length state if render did access history length
		// eslint-disable-next-line react-hooks/exhaustive-deps
		useLayoutEffect(() => {
			setHistoryLength(window.history.length);
		});

		// If component did render with updated location/history, update the browsers history
		useLayoutEffect(() => {
			if (action === PUSH) {
				window.history.pushState(historyState, documentTitle, locationPath);
			} else if (action === REPLACE) {
				window.history.replaceState(historyState, documentTitle, locationPath);
			}
		}, [action, historyState, documentTitle, locationPath]);

		// Do not render children before subscribed to popstate event
		// as a child could navigate in its useEffect on mount, and this will
		// be executed before this effect
		if (!mounted) return null;

		return (
			<LocationContext.Provider value={location}>
				<HistoryContext.Provider value={history}>
					<PendingContext.Provider value={pending}>
						<Component />
					</PendingContext.Provider>
				</HistoryContext.Provider>
			</LocationContext.Provider>
		);
	};
}
