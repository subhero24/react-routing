import Test from '../test';
import React from 'react';
import Routes from '../../source/index.js';
import Renderer from 'react-test-renderer';

import useParams from '../../source/hooks/use-params';

function RouteA(props) {
	return props.children;
}

function RouteB() {
	return null;
}

Test(function () {
	let routes = (
		<RouteA path=":a">
			<RouteB path=":b" />
		</RouteA>
	);
	let location = '/x/y';

	let Router = Routes(routes, { location });

	let render;
	Renderer.act(function () {
		render = Renderer.create(<Router />);
	});

	let result = render.toTree();
	if (result.rendered.rendered.rendered.props.params.a === undefined)
		throw new Error('The parent param was not found');
});
