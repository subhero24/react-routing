import ParamsContext from '../contexts/params';
import { useContext } from 'react';

export default function useSplat() {
	return useContext(ParamsContext);
}
