import Test from '../test';
import React from 'react';
import Routes from '../../source/index.js';
import Renderer from 'react-test-renderer';

function Route() {
	return null;
}

Test(function () {
	let routes = <Route path="a" />;
	let location = '/a';

	let Router = Routes({ location }, routes);

	let render;
	Renderer.act(function () {
		render = Renderer.create(<Router />);
	});

	let result = render.toTree();
	if (result.rendered.props.render !== Route) throw new Error('Route without leading slash should still match');
});
