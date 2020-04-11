export default function matcherByRegex(regex) {
	return function(path) {
		let match = path.match(regex);
		if (match) {
			let splat;
			let params;
			let length = match[0].length;
			if (match.groups) {
				params = match.groups;
			} else {
				params = match.slice(1);
			}
			return { splat, params, length };
		}
	};
}
