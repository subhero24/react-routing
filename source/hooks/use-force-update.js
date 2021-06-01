import { useReducer } from 'react';

export default function useForceUpdate() {
	return useReducer(x => x + 1, 0)[1];
}
