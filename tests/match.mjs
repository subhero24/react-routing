import { test } from 'uvu';
import matcher from '../source/utils/paths/matcher.js';

// test('Descriptor "a" for path "/a/b"', function () {
// 	let match = matcher('a', '/a/b');
// 	if (match == undefined) {
// 		throw new Error('Descriptor "/a/b" should match path "/a/b"');
// 	}

// 	console.log(match);

// 	if (match.path !== '/b') {
// 		throw new Error('Match path should be "/b"');
// 	}

// 	if (match.base !== '/a/b/') {
// 		throw new Error('Matching base should be "/a/b/"');
// 	}

// 	if (match.path !== '') {
// 		throw new Error('Matching path should be empty');
// 	}

// 	if (match.strict !== true) {
// 		throw new Error('Matching type should be strict');
// 	}
// });

// test('Descriptor /a/b for path /a/b', function () {
// 	let match = matcher('/a/b', '/a/b');
// 	if (match == undefined) {
// 		throw new Error('Descriptor "/a/b" should match path "/a/b"');
// 	}

// 	console.log(match);

// 	if (match.base !== '/a/b/') {
// 		throw new Error('Matching base should be "/a/b/"');
// 	}

// 	if (match.path !== '') {
// 		throw new Error('Matching path should be empty');
// 	}

// 	if (match.strict !== true) {
// 		throw new Error('Matching type should be strict');
// 	}
// });

// test('Descriptor /a/b/ for path /a/b', function () {
// 	let match = matcher('/a/b', '/a/b/');
// 	if (match) {
// 		throw new Error('Descriptor "/a/b/" should not match path "/a/b"');
// 	}
// });

// test('Descriptor /a/b for path /a/b/', function () {
// 	let match = matcher('/a/b/', '/a/b');
// 	if (match == undefined) {
// 		throw new Error('Descriptor "/a/b" should match path "/a/b/"');
// 	}

// 	if (match.base !== '/a/b') {
// 		throw new Error('Matching base should be "/a/b"');
// 	}

// 	if (match.path !== '/') {
// 		throw new Error('Matching path should be "/"');
// 	}

// 	if (match.strict !== false) {
// 		throw new Error('Matching type should not be strict');
// 	}
// });

// test('Descriptor /:a for path /a', function () {
// 	let match = matcher('/a', '/:a');
// 	if (match == undefined) {
// 		throw new Error('Descriptor "/:a" should match path "/a"');
// 	}

// 	if (match.path !== '') {
// 		throw new Error('Matching path should be empty');
// 	}

// 	if (match.params.a !== 'a') {
// 		throw new Error('Param "a" should have value "a"');
// 	}

// 	if (match.strict !== true) {
// 		throw new Error('Matching type should be strict');
// 	}
// });

// test('Descriptor /a for path /a/b', function () {
// 	let match = matcher('/a/b', '/a');
// 	if (match == undefined) {
// 		throw new Error('Descriptor "/a" should match path "/a/b"');
// 	}

// 	if (match.base !== '/a') {
// 		throw new Error('Matching base should be "/a"');
// 	}

// 	if (match.path !== '/b') {
// 		throw new Error('Matching path should be "/b"');
// 	}

// 	if (match.splat.length !== 1 || match.splat[0] !== 'b') {
// 		throw new Error('Matching splat should be ["b"]');
// 	}

// 	if (match.strict !== false) {
// 		throw new Error('Matching type should not be strict');
// 	}
// });

// test('Descriptor /a for path /a?x=y#hash', function () {
// 	let match = matcher('/a?x=y#hash', '/a');
// 	if (match == undefined) {
// 		throw new Error('Descriptor "/a" should match path "/a?x=y#hash"');
// 	}

// 	if (match.search !== '?x=y') {
// 		throw new Error('Matching search should be "?x=y"');
// 	}

// 	if (match.hash !== '#hash') {
// 		throw new Error('Matching hash should be "#hash"');
// 	}

// 	if (match.strict !== true) {
// 		throw new Error('Matching type should be strict');
// 	}
// });

test.run();
