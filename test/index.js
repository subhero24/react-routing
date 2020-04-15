import './mocks/window';
import './mocks/history/basic';
import './mocks/document/empty';
import './mocks/location/a';

import React from 'react';
import Routes from '../source/index.js';
import Renderer from 'react-test-renderer';

import Test from './test';

function RouteA(props) {
	return null;
}

// test('route with no path should match default location', function () {
// 	let Router = Routes(<RouteA />);

// 	let render;
// 	Renderer.act(function () {
// 		render = Renderer.create(<Router />);
// 	});

// 	let result = render.toTree();
// 	if (result.rendered == null) throw new Error('Route did not match');
// 	if (result.type !== RouteA) throw new Error('Wrong route rendered');
// });

Test(function (test) {
	test.description = `
		Location:
			/a
		Router:
			<RouteA path="/a" />
	`;

	let Router = Routes(<RouteA path="/a" />);

	let render;
	Renderer.act(function () {
		render = Renderer.create(<Router />);
	});

	let result = render.toTree();
	if (result.rendered.props.component !== RouteA) throw new Error('Did not render RouteA');
});
