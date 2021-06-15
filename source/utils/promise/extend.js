import sleep from './sleep.js';
import traverse from '../traverse.js';

export default function extend(elements, ms) {
	let delay = sleep(ms);
	traverse(elements, function (element) {
		let resource = element.props.resource;
		if (resource?.status === 'busy') {
			resource.promise = delay.then(resource.promise);
		}
	});
}
