import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import moduleFederationConfig from './module-federation.config';

export default defineConfig({
  plugins: [pluginReact(), /*pluginModuleFederation(moduleFederationConfig)*/],
  server: {
    port: 3001,
  },
  output: {
    minify: false,
    filenameHash: false,
    target: 'web',
    module: true,
  },
  // tools: {
  //   rspack: {
  //     output: {
  //       module: true,
  //       chunkFormat: 'module',
  //       chunkLoading: 'import',
  //       library: {
  //         type: 'module',
  //       },
  //     },
  //     experiments: {
  //       outputModule: true,
  //     },
  //   },
  // },
});
