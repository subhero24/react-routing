import useResource from './use-resource';

export default function useData(resource) {
	let routeResource = useResource();
	if (resource == undefined) resource = routeResource;
	if (resource) {
		if (resource.status === 'busy') {
			throw resource.promise;
		} else if (resource.status === 'error') {
			throw resource.result;
		} else if (resource.status === 'done') {
			return resource.result;
		}
	}
}
