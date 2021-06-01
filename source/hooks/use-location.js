import LocationContext from '../contexts/location';
import { useContext } from 'react';

export default function useLocation() {
	let { location } = useContext(LocationContext);
	if (location == undefined) {
		console.warn('The "useLocation" hook must be used inside a <Router> component.');
	}
	return location;
}
