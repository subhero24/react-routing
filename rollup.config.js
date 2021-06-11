import pluginBabel from '@rollup/plugin-babel';
import pluginTerser from 'rollup-plugin-terser';
import pluginCommonJS from '@rollup/plugin-commonjs';
import pluginNodeResolve from '@rollup/plugin-node-resolve';
import pluginNodePolyfills from 'rollup-plugin-node-polyfills';

let development = process.env.NODE_ENV === 'development';

let config = [
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
				// presets: ['@babel/preset-env'],
				plugins: ['@babel/plugin-transform-react-jsx'],
			}),
		],
		external: [/@babel\/runtime/, 'react'],
	},
];

if (development === false) {
	config[0].plugins.push(
		pluginTerser.terser({
			mangle: true,
			safari10: true,
		}),
	);
}

export default config;
