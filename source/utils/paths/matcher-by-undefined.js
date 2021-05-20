export default function MatcherByUndefined() {
	return function (path, base) {
		let match = path.match(/([^?#]*)(\?[^#]*)?(#.*)?/);
		let pathName = match[1];

		let splat = pathName.replace(/^\/+/, '').split('/');
		let params = {};

		return { base, params, splat };
	};
}
