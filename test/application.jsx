import React, { Suspense } from 'react';
import Routes, { useData, useSplat, useNavigate, Link, Redirect, useHistory, usePending } from '../build/index.mjs';

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

async function fetcher(parrams, splat, search) {
	console.log('woto');
}

let Router = Routes(<Navigator data={fetcher} />);

export default function Application() {
	return <Router />;
}

function Navigator() {
	let history = useHistory();

	function onWootClick() {
		history.navigate('/divisions/4238?week=02#ranking');
	}

	function onYeetClick() {
		history.navigate('#matches');
	}

	return (
		<div>
			<button onClick={onWootClick}>woot</button>
			<button onClick={onYeetClick}>yeet</button>
		</div>
	);
}

function Parent(props) {
	return (
		<>
			<h1>parent</h1>
			{props.children}
		</>
	);
}

function Child() {
	return 'child';
}

function Other() {
	return 'other';
}

function A(props) {
	let splat = useSplat();

	console.log(splat);

	return <span>A</span>;
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
