import '../mocks/window';
import '../mocks/history/basic';
import '../mocks/document/empty';
import '../mocks/location/a';

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
			/a
		Router:
			<Route path="/a" />
	`;

	let Router = Routes(<Route path="/a" />);

	let render;
	Renderer.act(function () {
		render = Renderer.create(<Router />);
	});

	let result = render.toTree();
	if (result.rendered.props.component !== Route) throw new Error('Did not render Route');
});
