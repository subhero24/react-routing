import Test from '../test';
import React from 'react';
import Child from '../../source/components/child';
import Routes from '../../source/index.js';
import Renderer from 'react-test-renderer';

function ParentRoute(props) {
	return <Child extraProp="someProp" />;
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

	let Router = Routes(routes, { location });

	let render;
	Renderer.act(function () {
		render = Renderer.create(<Router />);
	});

	let result = render.toTree();
	if (result.rendered.rendered.rendered.rendered.rendered.type !== ChildRoute)
		throw new Error(`The <Child /> element did not render the child route`);

	if (result.rendered.rendered.rendered.rendered.rendered.props.extraProp !== 'someProp')
		throw new Error(`The <Child /> element's parameter did not pass to the child route`);
});
