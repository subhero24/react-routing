import { useRef } from 'react';

export default function useLatestRef(value) {
	let ref = useRef();

	ref.current = value;

	return ref;
}
