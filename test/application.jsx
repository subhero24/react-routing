import React, { Suspense, useEffect } from 'react';
import Routes, { useData, useSplat, useNavigate, Link, Redirect, useHistory, usePending } from '../build/index.mjs';

async function sleep(ms) {
	return new Promise(function (resolve) {
		setTimeout(resolve, ms);
	});
}

async function sleep3000() {
	await sleep(3000);
}

function Container(props) {
	useEffect(() => {
		console.log('mount');
	}, []);

	return (
		<>
			<div style={{ display: 'flex', gap: '2rem' }}>
				<Link to="/a">to a</Link>
				<Link to="/b">to b</Link>
				<Link to="/a" sticky={1500}>
					to a with sticky
				</Link>
				<Link to="/b" sticky={1500}>
					to b with sticky
				</Link>
			</div>
			{props.children}
		</>
	);
}

function Component1(props) {
	return (
		<Suspense fallback="fallback for component 1">
			<Component1Child />
		</Suspense>
	);
}

function Component1Child(props) {
	let data = useData();
	let pending = usePending();

	return (
		<>
			component1
			{pending ? ' x ' : null}
		</>
	);
}

function Component2(props) {
	let data = useData();
	let pending = usePending();

	return (
		<>
			component2
			{pending ? ' x ' : null}
		</>
	);
}

function Child1() {
	return 'child1';
}

function Child2() {
	return 'child1';
}

function Parent(props) {
	return (
		<>
			<h1>parent</h1>
			{props.children}
		</>
	);
}

function SubParent(props) {
	return (
		<>
			<h2>subparent</h2>
			{props.children}
		</>
	);
}

let Router = Routes(
	<Parent path="a/:x">
		<Child1 path="b/:y" />
		<SubParent>
			<Child2 path="c" />
		</SubParent>
	</Parent>,
);

export default function Application() {
	return <Router />;
}
