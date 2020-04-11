import SplatContext from '../contexts/splat';
import { useContext } from 'react';

export default function useSplat() {
	return useContext(SplatContext);
}
