import React from 'react';
import Routes from '../build/index.mjs';

let Router = Routes(
	<Parent path="parent">
		<Child
			path="child?a=5"
			data={function (params, splat, search) {
				console.log(search);
			}}
		/>
	</Parent>,
);

export default function Application() {
	return <Router />;
}

function Parent(props) {
	return (
		<div>
			<h1>Parent</h1>
			<div>{props.children}</div>
		</div>
	);
}

function Child(props) {
	return (
		<div>
			<h1>Child</h1>
			<div>{props.children}</div>
		</div>
	);
}

function Descendant(props) {
	return 'desc';
}
