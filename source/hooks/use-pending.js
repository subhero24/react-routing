import PendingContext from '../contexts/pending';
import { useContext } from 'react';

export default function usePending() {
	return useContext(PendingContext);
}
