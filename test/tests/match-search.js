import Test from '../test';
import React from 'react';
import Routes from '../../source/index.js';
import Renderer from 'react-test-renderer';

function Route() {
	return 'route';
}

Test(function () {
	let routes = <Route path="a" />;
	let location = '/a?b=c&d=e';

	let Router = Routes(routes, { location });

	let render;
	Renderer.act(function () {
		render = Renderer.create(<Router />);
	});

	let result = render.toTree();

	if (result.rendered.rendered.rendered !== 'route') throw new Error('The location with search did not match');
});
