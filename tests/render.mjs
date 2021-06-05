import React from 'react';
import Render from 'react-test-renderer';
import Routes from '../build/index.mjs';

import { useParams, useSplat, Redirect } from '../build/index.mjs';

import { test } from 'uvu';

function Component() {
	return 'component';
}

function Parent(props) {
	return <div>{props.children}</div>;
}

function Child(props) {
	return 'child';
}

function Other(props) {
	return 'other';
}

function Third(props) {
	return 'third';
}

test('Should render basic component without path', function () {
	let Router = Routes(<Component></Component>, { location: '/' });

	let element = Render.create(<Router />).toJSON();
	if (element !== 'component') {
		throw new Error('Component should have rendered');
	}
});

test('Should not render component with mismatching path', function () {
	let Router = Routes(<Component path="a"></Component>, { location: '/' });

	let element = Render.create(<Router />).toJSON();
	if (element !== null) {
		throw new Error('Component should not have rendered');
	}
});

test('Should not render component with mismatching path', function () {
	let Router = Routes(<Component path="a"></Component>, { location: '/b' });

	let element = Render.create(<Router />).toJSON();
	if (element !== null) {
		throw new Error('Component should not have rendered');
	}
});

test('Should render component with matching path', function () {
	let Router = Routes(<Component path="a"></Component>, { location: '/a' });

	let element = Render.create(<Router />).toJSON();
	if (element !== 'component') {
		throw new Error('Component should have rendered');
	}
});

test('Should not render component with mismatching trailing slash', function () {
	let Router = Routes(<Component path="a"></Component>, { location: '/a/' });

	let render = Render.create(<Router />).toJSON();
	if (render !== null) {
		throw new Error('Component should not have rendered');
	}
});

test('Should not render component with trailing slash when path does not have a trailing slash', function () {
	let Router = Routes(<Component path="a/"></Component>, { location: '/a' });

	let element = Render.create(<Router />).toJSON();
	if (element !== null) {
		throw new Error('Component should not have rendered');
	}
});

test('Should render component with trailing slash when path does not have a trailing slash', function () {
	let Router = Routes(<Component path="a/"></Component>, { location: '/a/' });

	let element = Render.create(<Router />).toJSON();
	if (element === null) {
		throw new Error('Component should have rendered');
	}
});

test('Should not render component with trailing slash when path does have extra parts', function () {
	let Router = Routes(<Component path="a/"></Component>, { location: '/a/b' });

	let element = Render.create(<Router />).toJSON();
	if (element !== null) {
		throw new Error('Component should not have rendered');
	}
});

test('Should render component with absolute path', function () {
	let Router = Routes(<Component path="/a"></Component>, { location: '/a' });

	let element = Render.create(<Router />).toJSON();
	if (element !== 'component') {
		throw new Error('Component should have rendered');
	}
});

test('Should render parent with matching path', function () {
	let Router = Routes(
		<Parent path="a">
			<Child />
		</Parent>,
		{ location: '/a' },
	);

	let element = Render.create(<Router />).toJSON();
	if (element?.type !== 'div') {
		throw new Error('Parent should have rendered');
	}

	if (element?.children?.[0] !== 'child') {
		throw new Error('Child should have rendered');
	}
});

test('Should render parent and children with matching path', function () {
	let Router = Routes(
		<Parent path="a">
			<Child />
			<Other />
		</Parent>,
		{ location: '/a' },
	);

	let element = Render.create(<Router />).toJSON();

	if (element?.type !== 'div') {
		throw new Error('Parent should have rendered');
	}

	if (element?.children?.[0] !== 'child') {
		throw new Error('Child should have rendered');
	}

	if (element?.children?.[1] !== 'other') {
		throw new Error('Other should have rendered');
	}
});

test('Should render strictly if parent has only children without paths', function () {
	let Router = Routes(
		<Parent path="a">
			<Child />
			<Other />
		</Parent>,
		{ location: '/a/b' },
	);

	let element = Render.create(<Router />).toJSON();
	if (element !== null) {
		throw new Error('Parent should not have matched with location /a/b');
	}
});

test('Should render strictly if parent has only children without paths', function () {
	let Router = Routes(
		<Parent path="a">
			<Child />
			<Other />
		</Parent>,
		{ location: '/a/' },
	);

	let element = Render.create(<Router />).toJSON();
	if (element !== null) {
		throw new Error('Parent should not have matched with location /a/');
	}
});

test('Should match loosely if parent has children with paths', function () {
	let Router = Routes(
		<Parent path="a">
			<Child path="b" />
			<Other path="b" />
		</Parent>,
		{ location: '/a/b' },
	);

	let element = Render.create(<Router />).toJSON();
	if (element?.children?.length !== 2) {
		throw new Error('Parent and children should have matched');
	}
});

test('Should match absolute path from child', function () {
	let Router = Routes(
		<Parent path="a">
			<Child path="/a/b" />
		</Parent>,
		{ location: '/a/b' },
	);

	let element = Render.create(<Router />).toJSON();
	if (element?.children?.length !== 1) {
		throw new Error('Child should have matched');
	}
});

test('Should mismatch absolute path from child', function () {
	let Router = Routes(
		<Parent path="a">
			<Child path="/b" />
		</Parent>,
		{ location: '/a/b' },
	);

	let element = Render.create(<Router />).toJSON();

	if (element?.children != null) {
		throw new Error('Child should not have matched');
	}
});

test('Should render index route', function () {
	let Router = Routes(
		<Parent path="a">
			<Child path="." />
		</Parent>,
		{ location: '/a' },
	);

	let element = Render.create(<Router />).toJSON();
	if (element.children == null) {
		throw new Error('Route child with index path did not render');
	}
});

test('Should render children with ids as child prop', function () {
	function Parent(props) {
		return props.child.other;
	}

	let Router = Routes(
		<Parent path="a">
			<Child id="child" path="b" />
			<Other id="other" path="b" />
		</Parent>,
		{ location: '/a/b' },
	);

	let element = Render.create(<Router />).toJSON();
	if (element !== 'other') {
		throw new Error('Child with id "other" did not end up in the child prop of the parent');
	}
});

test('Should handle fragments', function () {
	let Router = Routes(
		<>
			<Component path="a" />
			<Other path="a" />
		</>,
		{ location: '/a' },
	);

	let element = Render.create(<Router />).toJSON();
	if (element?.length !== 2) {
		throw new Error('Fragment did not render correctly');
	}
});

test('Should handle params', function () {
	function Component(props) {
		let { param } = useParams();

		return param;
	}

	let Router = Routes(
		<Component path=":param" />,

		{ location: '/a' },
	);

	let element = Render.create(<Router />).toJSON();
	if (element !== 'a') {
		throw new Error('Param was not handled correctly');
	}
});

test('Should prefer static segment over params', function () {
	let Router = Routes(
		<>
			<Child path=":param" />
			<Other path="a" />
		</>,
		{ location: '/a' },
	);

	let element = Render.create(<Router />).toJSON();
	if (element !== 'other') {
		throw new Error('Static segment should be prefered over param segments');
	}
});

test('Should render children with same path out of order', function () {
	let Router = Routes(
		<>
			<Child path="a" />
			<Other path="b" />
			<Third path="a" />
		</>,
		{ location: '/a' },
	);

	let element = Render.create(<Router />).toJSON();
	let [child1, child2, child3] = element;
	if (child1 !== 'child' || child2 !== 'third' || child3 != undefined) {
		throw new Error('Children are not rendered correctly');
	}
});

test('Should render descriptor with splat', function () {
	function Component() {
		let splat = useSplat();

		return splat;
	}

	let Router = Routes(
		<>
			<Component path="a/*" />
		</>,
		{ location: '/a/b/c' },
	);

	let element = Render.create(<Router />).toJSON();
	if (element == null) {
		throw new Error('Splat descriptor should have matched');
	}

	if (element.length !== 2) {
		throw new Error('Splat should have 2 segments');
	}

	if (element[0] !== 'b' || element[1] !== 'c') {
		throw new Error('Splat value is not correct');
	}
});

test('Should render redirect', function () {
	let Router = Routes(
		<>
			<Component path="a" />
			<Redirect path="/" to="a" />
		</>,
		{ location: '/' },
	);

	let element = Render.create(<Router />).toJSON();
	if (element !== 'component') {
		throw new Error('Should have redirected the url');
	}
});

test('Should render redirect with trailing slash', function () {
	let Router = Routes(
		<>
			<Child path="a" />
			<Other path="a/" />
			<Redirect path="/" to="a/" />
		</>,
		{ location: '/' },
	);

	let element = Render.create(<Router />).toJSON();
	if (element !== 'other') {
		throw new Error('Should have redirected the url with trailing slash');
	}
});

test('Should render child with trailing slash', function () {
	let Router = Routes(
		<Parent path="a">
			<Child path="./" />
		</Parent>,
		{ location: '/a/' },
	);

	let element = Render.create(<Router />).toJSON();
	if (element?.children == null) {
		throw new Error('Should have rendered the child with the trailing slash');
	}
});

test('Should not render child without trailing slash', function () {
	let Router = Routes(
		<Parent path="a/">
			<Child path="b" />
		</Parent>,
		{ location: '/a/b/' },
	);

	let element = Render.create(<Router />).toJSON();
	if (element?.children != null) {
		throw new Error('Should not have rendered the child because the location ended with a slash');
	}
});

test('Should render child without trailing slash', function () {
	let Router = Routes(
		<Parent path="a/">
			<Child path="b" />
		</Parent>,
		{ location: '/a/b' },
	);

	let element = Render.create(<Router />).toJSON();
	if (element?.children == null) {
		throw new Error('Should have rendered the child');
	}
});

test.run();
