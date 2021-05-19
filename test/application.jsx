import React from 'react';
import Routes from '../build/index.mjs';

async function f(params, splat, search) {
	for (let [key, value] of new URLSearchParams(search)) {
		console.log(key, value);
	}

	return {};
}

let Router = Routes(<Parent path="woot/" data={f} />);

export default function Application() {
	return <Router />;
}

function Parent(props) {
	return <div>test</div>;
}
