import React, { Suspense } from 'react';
import Routes, { useData, useSplat, useNavigate, Link, Redirect, useHistory, usePending } from '../build/index.mjs';

async function sleep(ms) {
	return new Promise(function (resolve) {
		setTimeout(resolve, ms);
	});
}

async function sleep4000() {
	await sleep(4000);
}

function Container(props) {
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
		<Component1 path="a" data={sleep4000} />
		<Component2 path="b" data={sleep4000} />
	</Container>,
);

export default function Application() {
	return <Router maxTransitionTimeout={3500} pendingMinimum={2000} fallback="router fallback" />;
}
