export default function isStaticSegment(segment) {
	return /^[^:*]/.test(segment);
}
