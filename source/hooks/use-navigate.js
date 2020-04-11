import useHistory from './use-history';

export default function useNavigate() {
	let history = useHistory();
	return history.navigate;
}
