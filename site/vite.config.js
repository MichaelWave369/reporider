import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  base:'/reporider/',
  plugins:[react()],
  server:{fs:{allow:['..']}},
});
