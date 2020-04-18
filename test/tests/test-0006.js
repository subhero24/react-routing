import '../mocks/window';
import '../mocks/history/basic';
import '../mocks/document/empty';
import '../mocks/location/a/index.js';

import Test from '../test';
import React from 'react';
import Routes from '../../source/index.js';
import Redirect from '../../source/components/redirect.js';
import Renderer from 'react-test-renderer';

function Route(props) {
	return null;
}

Test(function (test) {
	test.description = `
		Location:
			/a/
		Router:
			<Route path="a">
				<Route path="." />
				<Redirect path="/" to="." />
			</Route>
	`;

	let Router = Routes(
		<Route path="a">
			<Route path="." />
			<Redirect path="/" to="." />
		</Route>,
	);

	let render;
	Renderer.act(function () {
		render = Renderer.create(<Router />);
	});

	let result = render.toTree();
	if (result.rendered.props.component !== Route) throw new Error('Route /a/ should redirect to /a rendering Route');
});
