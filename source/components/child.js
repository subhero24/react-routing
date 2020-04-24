import { cloneElement } from 'react';

import useChild from '../hooks/use-child';

export default function Child(props) {
	let child = useChild();

	return child == null ? null : cloneElement(child, props);
}
