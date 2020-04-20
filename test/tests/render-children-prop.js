import Test from '../test';
import React from 'react';
import Routes from '../../source/index.js';
import Renderer from 'react-test-renderer';

function ParentRoute(props) {
	return props.children;
}

function ChildRoute(props) {
	return null;
}

Test(function () {
	let routes = (
		<ParentRoute path="parent">
			<ChildRoute path="child" />
		</ParentRoute>
	);

	let location = '/parent/child';

	let Router = Routes({ location }, routes);

	let render;
	Renderer.act(function () {
		render = Renderer.create(<Router />);
	});

	let result = render.toTree();
	if (result.rendered.rendered.rendered.rendered.type !== ChildRoute)
		throw new Error(`The "children" prop did not contain the child route`);
});
