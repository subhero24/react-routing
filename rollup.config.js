import pluginBabel from '@rollup/plugin-babel';
import pluginTerser from 'rollup-plugin-terser';
import pluginCommonJS from '@rollup/plugin-commonjs';
import pluginNodeResolve from '@rollup/plugin-node-resolve';
import pluginNodePolyfill from 'rollup-plugin-node-builtins';

export default [
	{
		input: 'source/index.js',
		output: {
			file: 'build/index.js',
			format: 'esm',
			sourcemap: true,
		},
		plugins: [
			pluginNodePolyfill(),
			pluginNodeResolve({ preferBuiltins: true }),
			pluginCommonJS(),
			pluginBabel({
				babelHelpers: 'runtime',
				plugins: ['@babel/plugin-transform-runtime', '@babel/plugin-transform-react-jsx'],
			}),
			pluginTerser.terser({
				mangle: true,
				safari10: true,
			}),
		],
		external: [/@babel\/runtime/, 'react'],
	},
];
