import HistoryContext from '../contexts/history';
import { useContext } from 'react';

export default function useHistory() {
	let { history } = useContext(HistoryContext);
	if (history == undefined) {
		console.warn('The "useHistory" hook must be used inside a <Router> component.');
	}
	return history;
}
