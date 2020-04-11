import { useContext } from 'react';

import ChildComponentContext from '../contexts/child';

export default function useChildComponent() {
	return useContext(ChildComponentContext);
}
