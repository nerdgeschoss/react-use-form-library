import esbuild from 'rollup-plugin-esbuild';
import cleaner from 'rollup-plugin-cleaner';
import pkg from './package.json';

export default {
  input: './src/index.ts',
  external: ['react'],
  runtimeHelpers: true,
  plugins: [
    [
      '@babel/plugin-transform-runtime',
      {
        regenerator: true,
      },
    ],
    cleaner({
      targets: ['./dist/'],
    }),
    esbuild({
      target: 'es6',
    }),
  ],
  output: [
    {
      file: pkg.main,
      format: 'cjs',
    },
    {
      file: pkg.module,
      format: 'es',
    },
  ],
};
