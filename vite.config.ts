import { defineConfig, type PluginOption } from 'vite';
import uniPlugin from '@dcloudio/vite-plugin-uni';
import path from 'node:path';

type UniPluginFactory = () => PluginOption;
const uni = ((uniPlugin as unknown as { default?: UniPluginFactory }).default ?? uniPlugin) as UniPluginFactory;

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});
