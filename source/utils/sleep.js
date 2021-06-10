export default function sleep(ms) {
	return new Promise(function (resolve) {
		setTimeout(resolve, ms);
	});
}
