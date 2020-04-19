export default function locationPath(location) {
	return location.pathname + location.search + location.hash;
}
