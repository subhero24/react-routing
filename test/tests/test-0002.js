import '../mocks/window';
import '../mocks/history/basic';
import '../mocks/document/empty';
import '../mocks/location';

import Test from '../test';
import React from 'react';
import Routes from '../../source/index.js';
import Renderer from 'react-test-renderer';

function Route(props) {
	return null;
}

Test(function (test) {
	test.description = `
		Location:
			/
		Router:
			<Route path="/" />
	`;

	let Router = Routes(<Route path="/" />);

	let render;
	Renderer.act(function () {
		render = Renderer.create(<Router />);
	});

	let result = render.toTree();
	if (result.rendered.props.component !== Route) throw new Error('Did not render Route');
});
