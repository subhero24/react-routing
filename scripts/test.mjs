import Path from 'path';
import Process from 'child_process';
import Filesystem from 'fs-extra';

Process.spawnSync('npx', ['babel', './tests', '--plugins', '@babel/plugin-transform-react-jsx', '--out-dir', 'temp'], {
	stdio: 'inherit',
});

let fileEntries = await Filesystem.readdir('temp', { withFileTypes: true });
for (let fileEntry of fileEntries) {
	let fileName = fileEntry.name.replace('.js', '.mjs');
	let originalFilePath = Path.resolve('temp', fileEntry.name);
	let updatedFilePath = Path.resolve('temp', fileName);
	await Filesystem.rename(originalFilePath, updatedFilePath);
}

Process.spawnSync('npx', ['uvu', 'temp'], { stdio: 'inherit' });

await Filesystem.remove('temp');
