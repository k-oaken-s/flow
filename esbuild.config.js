require('esbuild').build({
    entryPoints: ['src/renderer/app.tsx'],
    bundle: true,
    outfile: 'dist/app.js',
    platform: 'browser',
    loader: {
      '.css': 'css'
    }
  }).catch(() => process.exit(1));