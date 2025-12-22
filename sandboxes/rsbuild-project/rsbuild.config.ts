import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import pluginDefine from "@computerwwwizards/rsbuild-define-plugin"
import { tanstackRouter } from '@tanstack/router-plugin/rspack'

export default defineConfig({
  plugins: [pluginDefine(), pluginReact(),],
  tools: {
    rspack: {
      plugins: [tanstackRouter({
        target: 'react',
        autoCodeSplitting: true
      })]
    }
  }
});
