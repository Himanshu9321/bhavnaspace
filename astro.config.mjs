import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://bhavnaspace.com',
  output: 'static',
  compressHTML: true,
  build: {
    format: 'directory',
  },
});
