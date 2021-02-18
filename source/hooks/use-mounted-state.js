import { useState, useCallback } from 'react';

import useMountedRef from './use-mounted-ref';

export default function useMountedState(value) {
	let mountedRef = useMountedRef();
	let [state, setState] = useState(value);

	let setMountedState = useCallback(
		function (newState) {
			if (mountedRef.current) {
				setState(newState);
			}
		},
		[mountedRef],
	);

	return [state, setMountedState];
}
