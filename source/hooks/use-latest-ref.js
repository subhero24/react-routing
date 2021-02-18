import { useRef, useEffect } from 'react';

export default function useLatestRef(value) {
	// We do not pass the value, as access to this should only
	// happen in callbacks, after useEffect has already run
	let ref = useRef();

	ref.current = value;
	// useEffect(() => {
	// 	ref.current = value;
	// });

	return ref;
}
