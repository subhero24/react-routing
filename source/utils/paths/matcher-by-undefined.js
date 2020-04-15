export default function MatcherByUndefined() {
	return function (path) {
		let splat = path.replace(/^\/+/, '').split('/');
		let params = {};
		let length = 0;
		return { splat, params, length };
	};
}
