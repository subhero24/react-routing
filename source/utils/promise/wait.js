import traverse from '../traverse.js';

export default function wait(elements) {
	let promises = [];

	traverse(elements, function (element) {
		if (element.props.resource) {
			promises.push(element.props.resource.promise);
		}
	});

	return Promise.all(promises);
}
