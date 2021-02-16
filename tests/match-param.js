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
	let location = '/users/id';

	let Router = Routes(routes, { location });

	let render;
	Renderer.act(function () {
		render = Renderer.create(<Router />);
	});

	let result = render.toTree();
	if (result.rendered.rendered.rendered !== 'id') throw new Error('The useParam hook did not work');
});
