import { useEffect } from 'react';

import useMountedState from './use-mounted-state';

export default function useMounted() {
	let [mounted, setMounted] = useMountedState(false);

	useEffect(() => {
		setMounted(true);

		return () => {
			setMounted(false);
		};
	}, [setMounted]);

	return mounted;
}
