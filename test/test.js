export default function Test(...args) {
	let test = {};
	let runner = args.pop() ?? function () {};
	let filename = args.pop();

	runner(test);
}
