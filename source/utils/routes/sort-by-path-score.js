import score from '../paths/score';

export default function sortByPathScore(objects, propFn = o => o.path) {
	let scores = new Map();
	for (let object of objects) {
		scores.set(object, score(propFn(object)));
	}

	return objects.sort(function(a, b) {
		return scores.get(b) - scores.get(a);
	});
}
