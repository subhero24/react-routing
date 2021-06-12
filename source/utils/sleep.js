export default function sleep(ms) {
	return new Promise(function (resolve) {
		if (ms !== Infinity) {
			setTimeout(resolve, ms);
		}
	});
}
