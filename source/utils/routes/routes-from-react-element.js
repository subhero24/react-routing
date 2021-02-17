import Redirect from '../../components/redirect';

import { Children, Fragment, isValidElement } from 'react';

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
			if (element.type === Redirect) {
				route.redirect = element.props.to;

				if (element.props.to == undefined) {
					console.warn(`The <Redirect /> element should have a "to" prop.`);
				}
				if (element.props.data != undefined) {
					console.warn(`The <Redirect /> element should not have a data property.`);
				}
				if (element.props.children != undefined) {
					console.warn(`The <Redirect /> element should not have any child routes.`);
				}
			}

			route.path = element.props.path;
			route.render = element.type;
			if (element.props.data) route.data = element.props.data;
			if (element.props.children) route.routes = createRoutesFromReactElement(children);
			return [route];
		}
	}
}
