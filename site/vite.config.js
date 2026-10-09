import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// The website intentionally reuses plain TypeScript modules from the parent Expo app.
// Override tsconfig discovery: those library modules otherwise inherit root tsconfig,
// which extends Expo's native base (not installed in this small, static Pages build).
export default defineConfig({
  base:'/reporider/',
  plugins:[react()],
  esbuild:{
    tsconfigRaw:{
      compilerOptions:{
        target:'ES2022',
        jsx:'react-jsx',
        useDefineForClassFields:true,
      },
    },
  },
  server:{fs:{allow:['..']}},
});
