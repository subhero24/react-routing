export default function createResource(promise) {
	let resource = {
		status: 'busy',
		result: undefined,
	};

	let resolve = function(result) {
		resource.status = 'done';
		resource.result = result;
	};

	let reject = function(error) {
		resource.status = 'error';
		resource.result = error;
	};

	resource.promise = promise.then(resolve, reject);

	return resource;
}
