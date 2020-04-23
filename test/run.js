import Path from 'path';
import FileSystem from 'fs-extra';
import ChildProcess from 'child_process';

// const DEBUG =
const ARGS = process.argv.slice(2);
const DEBUG = ARGS[1] === 'debug';
const DIRECTORY = Path.join(__dirname, 'tests');

async function run() {
	console.log('🚀 Launching');

	let exitCode;
	let testPaths;
	let testPathArg = process.argv[2];
	if (testPathArg == undefined) {
		testPaths = await readDirectory(DIRECTORY);
	} else {
		let testPath = Path.resolve(testPathArg);
		let testPathExists = await FileSystem.exists(testPath);
		if (testPathExists) {
			testPaths = [testPath];
		} else {
			testPath = Path.resolve(DIRECTORY, testPathArg);
			testPaths = [Path.resolve(DIRECTORY, testPathArg)];
		}
	}

	let testPromises = testPaths.map(runTest);

	for (let index = 0; index < testPromises.length; ++index) {
		let testPromise = testPromises[index];
		let prevPromises = testPromises.slice(0, index + 1);

		let testPath = testPaths[index];
		let testFilename = Path.relative(DIRECTORY, testPath);

		try {
			await Promise.allSettled(prevPromises);
		} catch {}

		let { stdout, stderr, error } = await testPromise;
		if (error) {
			console.log(`   🧨 ${testFilename}`);
			if (stdout) console.log(stdout);
			if (stderr) console.error(stderr);
			if (exitCode == undefined) exitCode = 1;
		} else {
			console.log(`   🏁 ${testFilename}`);
			if (stdout) console.log(stdout);
			if (stderr) console.error(stderr);
		}
	}

	process.exit(exitCode);
}

run();

async function runTest(testPath) {
	let cmd = process.execPath;
	let args = ['-r', 'esm', '-r', '@babel/register', testPath];
	if (DEBUG) args.splice(-1, 0, '--inspect-brk=9229');

	let promise = new Promise(function (resolve) {
		// Running could be faster by using fork or spawn?
		// Spawn did not report the error as I wanted, have to look into fork
		ChildProcess.exec(`${cmd} ${args.join(' ')}`, function (stderr, stdout, error) {
			resolve({ stdout, stderr: error, error });
		});
	});

	return promise;
}

async function readDirectory(directoryPath) {
	let tests = [];
	let entries = await FileSystem.readdir(DIRECTORY, { withFileTypes: true });
	for (let entry of entries) {
		let entryPath = Path.join(directoryPath, entry.name);
		if (entry.isFile()) {
			tests = [...tests, entryPath];
		} else if (entry.isDirectory()) {
			tests = [...tests, ...readDirectory(entryPath)];
		}
	}
	return tests;
}
