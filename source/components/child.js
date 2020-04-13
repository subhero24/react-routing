import { cloneElement } from 'react';

import useChild from '../hooks/use-child';

export default function Child(props) {
	let child = useChild();

	return cloneElement(child, props);
}
