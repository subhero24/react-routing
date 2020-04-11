import LocationContext from '../contexts/location';
import { useContext } from 'react';

export default function useLocation() {
	return useContext(LocationContext);
}
