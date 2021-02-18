import { cloneElement } from 'react';

import useChild from '../hooks/use-child';

export default function Child(props) {
	let child = useChild();

	if (child == null) {
		return null;
	} else {
		let childProps = { ...child.props, props: { ...child.props.props, ...props } };
		return cloneElement(child, childProps);
	}
}
