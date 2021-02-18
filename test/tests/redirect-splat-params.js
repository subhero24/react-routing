import Test from '../test';
import React from 'react';
import Routes from '../../source/index.js';
import Redirect from '../../source/components/redirect.jsx';
import Renderer from 'react-test-renderer';

import { Fragment } from 'react';

function Route() {
	return null;
}

Test(function () {
	let routes = (
		<Fragment>
			<Route path="b/:id/*" />
			<Redirect path="a/:id/*" to="b/:id/*" />
		</Fragment>
	);
	let location = '/a/1/x/y/z';

	let Router = Routes(routes, { location });

	let render;
	Renderer.act(function () {
		render = Renderer.create(<Router />);
	});

	let result = render.toTree();
	if (result.rendered.props.render !== Route) throw new Error(`Redirect did not render target path`);
	if (result.rendered.props.params.id !== '1') throw new Error(`Redirect did not interpolate :id param`);
	if (result.rendered.props.splat == undefined) throw new Error(`Redirect did not interpolate * splat`);
	if (result.rendered.props.splat[0] !== 'x') throw new Error(`Redirect did not interpolate * splat correctly`);
	if (result.rendered.props.splat[1] !== 'y') throw new Error(`Redirect did not interpolate * splat correctly`);
	if (result.rendered.props.splat[2] !== 'z') throw new Error(`Redirect did not interpolate * splat correctly`);
});
