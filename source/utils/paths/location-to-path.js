export default function locationToPath(location) {
	return location.pathname + location.search + location.hash;
}
