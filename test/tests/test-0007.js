import '../mocks/window';
import '../mocks/history/basic';
import '../mocks/document/empty';
import '../mocks/location/a/1/x/y/z';

import Test from '../test';
import React from 'react';
import Routes from '../../source/index.js';
import Redirect from '../../source/components/redirect.js';
import Renderer from 'react-test-renderer';

import { Fragment } from 'react';

function Route(props) {
	return null;
}

Test(function (test) {
	test.description = `
		Location:
			/a/1/x/y/z
		Router:
			<Fragment>
				<Route path="b/:id/*">
				<Redirect path="a/:id/*" to="b/:id/*" />
			</Fragment>
	`;

	let Router = Routes(
		<Fragment>
			<Route path="b/:id/*" />
			<Redirect path="a/:id/*" to="b/:id/*" />
		</Fragment>,
	);

	let render;
	Renderer.act(function () {
		render = Renderer.create(<Router />);
	});

	let result = render.toTree();
	if (result.rendered.props.component !== Route) throw new Error(`Redirect did not render target path`);
	if (result.rendered.props.params.id !== '1') throw new Error(`Redirect did not interpolate :id param`);
	if (result.rendered.props.splat == undefined) throw new Error(`Redirect did not interpolate * splat`);
	if (result.rendered.props.splat[0] !== 'x') throw new Error(`Redirect did not interpolate * splat correctly`);
	if (result.rendered.props.splat[1] !== 'y') throw new Error(`Redirect did not interpolate * splat correctly`);
	if (result.rendered.props.splat[2] !== 'z') throw new Error(`Redirect did not interpolate * splat correctly`);
});
