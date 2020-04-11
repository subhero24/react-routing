import ResourceContext from '../contexts/resource';
import { useContext } from 'react';

export default function useResource() {
	return useContext(ResourceContext);
}
