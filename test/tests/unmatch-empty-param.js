import Test from '../test';
import React from 'react';
import Routes from '../../source/index.js';
import Renderer from 'react-test-renderer';

import useParams from '../../source/hooks/use-params';

function Route() {
	let params = useParams();

	return params.id;
}

Test(function () {
	let routes = <Route path="users/:id" />;
	let location = '/users/';

	let Router = Routes({ location }, routes);

	let render;
	Renderer.act(function () {
		render = Renderer.create(<Router />);
	});

	let result = render.toTree();
	if (result.rendered !== null) throw new Error('The route did match with an empty param');
});
