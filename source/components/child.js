import React from 'react';

import useChild from '../hooks/use-child';

export default function Child(props) {
	let Child = useChild();

	return <Child {...props} />;
}
