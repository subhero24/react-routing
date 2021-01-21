import useHistory from './use-history';

export default function useNavigate() {
	let history = useHistory();
	if (history) {
		return history.navigate;
	}
}
