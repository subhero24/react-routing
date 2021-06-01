import { test } from 'uvu';
import score from '../source/utils/paths/score.js';

// test('Compare root path with path with param', function () {
// 	if (score(':a') <= score('/')) {
// 		throw new Error('A path with a param should have a higher score than root');
// 	}
// });

// test('Path with trailing slash should have higher score', function () {
// 	if (score('a/') <= score('a')) {
// 		throw new Error('A path with a trailing slash should have a higher score');
// 	}
// });

// test('Path with more segments should have higher score', function () {
// 	if (score('a/b/c') <= score('a/b')) {
// 		throw new Error('A path with more segments should have a higher score');
// 	}
// });

// test('Path with static segment should have higher score than a dynamic segment', function () {
// 	if (score('a/b/c') <= score('a/:b/c')) {
// 		throw new Error('A path with a dynamic segment should have a higher score');
// 	}
// });

// test('Root path should have higher score than dot path', function () {
// 	if (score('/') <= score('.')) {
// 		throw new Error('Root path should have a higher score than dot path');
// 	}
// });

test.run();
