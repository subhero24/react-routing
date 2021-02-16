import Test from '../test';
import React from 'react';
import Routes from '../../source/index.js';
import Redirect from '../../source/components/redirect.js';
import Renderer from 'react-test-renderer';

function Route() {
	return null;
}

Test(function () {
	let routes = (
		<Route path="a">
			<Route path="." />
			<Redirect path="/" to="." />
		</Route>
	);
	let location = '/a/';

	let Router = Routes(routes, { location });

	let render;
	Renderer.act(function () {
		render = Renderer.create(<Router />);
	});

	let result = render.toTree();
	if (result.rendered.props.render !== Route) throw new Error('Route /a/ should redirect to /a rendering Route');
});
