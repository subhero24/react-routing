import { Children, Fragment, isValidElement } from 'react';

import Redirect from '../components/redirect.jsx';

import score from './paths/score.js';

// We do not use the react element itself, as they are non extensible objects
// and we would like to add calculated properties (like strict) and reorder the children

export default function createRoutesFromReactElement(element) {
	let routes = [];

	if (element instanceof Array) {
		routes = element.map(e => createRoutesFromReactElement(e)[0]);
	} else if (isValidElement(element)) {
		let type = element.type;
		if (type === Fragment) {
			routes = Children.toArray(element.props.children).map(e => createRoutesFromReactElement(e)[0]);
		} else {
			if (type === Redirect) {
				if (element.props.to == undefined) {
					console.warn(`The <Redirect /> element should have a "to" prop.`);
				}
				if (element.props.data != undefined) {
					console.warn(`The <Redirect /> element should not have a "data" prop.`);
				}
				if (element.props.children != undefined) {
					console.warn(`The <Redirect /> element should not have any child routes.`);
				}
			}

			let { id, path, to, data, children } = element.props;

			if (children) {
				children = createRoutesFromReactElement(children);
			}

			let strict = children?.every(child => child.strict && child.path == undefined) ?? true;

			routes = [{ type, id, path, to, strict, data, children }];
		}
	} else if (typeof element === 'string') {
		console.warn(
			`There is a text-node "${element}" in your route config. Only React elements are allowed to specify routes.`,
		);
	}

	return sortRoutes(routes.filter(route => route != undefined));
}

function sortRoutes(routes) {
	// We do not want to recalculate the scores for each path in the
	// sort compare function because we would do the same work multiple times
	// So we calculate the scores up front
	let scores = {};
	for (let { path } of routes) {
		scores[path] = scores[path] ?? score(path);
	}

	return routes.sort(function (a, b) {
		// First we order by score
		if (scores[a.path] < scores[b.path]) return 1;
		if (scores[a.path] > scores[b.path]) return -1;

		// If the score is the same, we order by path descriptor
		if (a.path < b.path) return 1;
		if (a.path > b.path) return -1;

		return 0;
	});
}
