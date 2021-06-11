export default function traverse(elements, fn) {
	for (let element of elements) {
		fn(element);
		if (element.props.children) {
			traverse(element.props.children, fn);
		}
	}
}
