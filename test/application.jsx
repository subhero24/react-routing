import React, { Suspense, useEffect } from 'react';
import Routes, { useData, useSplat, useNavigate, Link, Redirect, useHistory, usePending } from '../build/index.mjs';

async function sleep(ms) {
	return new Promise(function (resolve) {
		setTimeout(resolve, ms);
	});
}

async function sleep6000() {
	await sleep(6000);
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
				<Link to="/a" sticky={true}>
					to a with sticky
				</Link>
				<Link to="/b" sticky={true}>
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

let Router = Routes(
	<Container>
		<Component1 path="a" data={sleep6000} />
		<Component2 path="b" data={sleep6000} />
	</Container>,
);

export default function Application() {
	return <Router maxTransitionTimeout={3500} pendingMinimum={2000} fallback="router fallback" />;
}
