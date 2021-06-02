import pluginBabel from '@rollup/plugin-babel';
import pluginTerser from 'rollup-plugin-terser';
import pluginCommonJS from '@rollup/plugin-commonjs';
import pluginNodeResolve from '@rollup/plugin-node-resolve';
import pluginNodePolyfills from 'rollup-plugin-node-polyfills';

export default [
	{
		input: 'source/index.js',
		output: {
			file: 'build/index.mjs',
			format: 'esm',
			sourcemap: true,
		},
		plugins: [
			pluginNodePolyfills(),
			pluginNodeResolve({ preferBuiltins: true }),
			pluginCommonJS(),
			pluginBabel({
				babelHelpers: 'bundled',
				presets: ['@babel/preset-env'],
				plugins: ['@babel/plugin-transform-react-jsx'],
			}),
			pluginTerser.terser({
				mangle: true,
				safari10: true,
			}),
		],
		external: [/@babel\/runtime/, 'react'],
	},
];
