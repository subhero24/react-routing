import { Children, Fragment } from 'react';
import { isValidElement } from 'react';

export default function createRoutesFromReactElement(element) {
	if (element == undefined) {
		return [];
	} else if (element instanceof Array) {
		return element.map(e => createRoutesFromReactElement(e)[0]);
	} else if (isValidElement(element)) {
		let children = Children.toArray(element.props.children);
		if (element.type === Fragment) {
			return children.map(e => createRoutesFromReactElement(e)[0]);
		} else {
			let route = {};
			route.path = element.props.path;
			route.render = element.type;
			if (element.props.data) route.data = element.props.data;
			if (element.props.children) route.routes = createRoutesFromReactElement(children);
			return [route];
		}
	}
}
