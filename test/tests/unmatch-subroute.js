import Test from '../test';
import React from 'react';
import Routes from '../../source/index.js';
import Renderer from 'react-test-renderer';

function ParentRoute() {
	return null;
}

function ChildRouteA() {
	return null;
}

function ChildRouteB() {
	return null;
}

Test(function () {
	let routes = (
		<ParentRoute path="parent">
			<ChildRouteA path="childA" />
			<ChildRouteB path="childB" />
		</ParentRoute>
	);

	let location = '/parent';

	let Router = Routes({ location }, routes);

	let render;
	Renderer.act(function () {
		render = Renderer.create(<Router />);
	});

	let result = render.toTree();
	if (result.rendered.props.component !== ParentRoute) throw new Error('The parent route did not match');
	if (result.rendered.props.children != null) throw new Error("The child route did match when it shouldn't");
});
