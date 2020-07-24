import Test from '../test';
import React from 'react';
import Routes from '../../source/index.js';
import Renderer from 'react-test-renderer';

import useSplat from '../../source/hooks/use-splat';

function ParentRoute() {
	let splat = useSplat();

	return splat;
}

function ChildRoute() {
	return null;
}

Test(function () {
	let routes = (
		<ParentRoute path="a">
			<ChildRoute path="b" />
		</ParentRoute>
	);
	let location = '/a/b/c';

	let Router = Routes(routes, { location });

	let render;
	Renderer.act(function () {
		render = Renderer.create(<Router />);
	});

	let result = render.toTree();
	if (result.rendered.rendered.rendered[0] !== 'b')
		throw new Error(`The useSplat hook did not result the trailing part of the location`);
	if (result.rendered.rendered.rendered[1] !== 'c')
		throw new Error(`The useSplat hook did not result the trailing part of the location`);
});
