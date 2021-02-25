import ParamsContext from '../contexts/params';
import { useContext } from 'react';

export default function useParams() {
	return useContext(ParamsContext);
}
