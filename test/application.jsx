import React, { Suspense } from 'react';
import Routes, { useData, useNavigate, Link, Redirect, usePending } from '../build/index.mjs';

async function sleep(ms) {
	return new Promise(function (resolve) {
		setTimeout(resolve, ms);
	});
}

async function fetchData(params) {
	await sleep(1000);
	return params;
}

async function fetchData1(params, splat, search) {
	await sleep(2000);
	return { params, splat, search };
}

async function fetchData2(params, splat, search) {
	await sleep(6000);
	return { params, splat, search };
}

let Router = Routes(
	<>
		<A path="a">
			<B data={fetchData1} />
			<C data={fetchData2} />
		</A>
		<X path="x" />
	</>,
);

export default function Application() {
	return <Router />;
}

function A(props) {
	let children = props.children.map(function (child) {
		// return child;
		return (
			<Suspense key={child.key} fallback="loading">
				{child}
			</Suspense>
		);
	});

	return (
		<>
			<div>{children}</div>
			<Link to="x">X</Link>
		</>
	);
}

function B(props) {
	let data = useData();

	return 'B';
}

function C(props) {
	let data = useData();

	return 'C';
}

function X(props) {
	let pending = usePending();

	return (
		<>
			<Link to="a" sticky={true}>
				A
			</Link>
			{pending ? 'pending' : null}
		</>
	);
}
