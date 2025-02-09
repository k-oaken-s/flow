const { execSync } = require('child_process');

exports.beforeBuild = async function(context) {
  console.log('Installing platform-specific sharp...');
  execSync('rm -rf node_modules/sharp', { stdio: 'inherit' });
  if (context.arch === 'x64') {
    execSync('npm install --platform=darwin --arch=x64 sharp', {
      stdio: 'inherit',
      env: {
        ...process.env,
        SHARP_IGNORE_GLOBAL_LIBVIPS: '1',
        npm_config_arch: 'x64',
        npm_config_platform: 'darwin',
        npm_config_build_from_source: 'true'
      }
    });
    execSync('npm rebuild sharp --build-from-source', { stdio: 'inherit' });
  } else if (context.arch === 'arm64') {
    execSync('npm install --platform=darwin --arch=arm64 sharp', {
      stdio: 'inherit',
      env: {
        ...process.env,
        SHARP_IGNORE_GLOBAL_LIBVIPS: '1',
        npm_config_arch: 'arm64',
        npm_config_platform: 'darwin',
        npm_config_build_from_source: 'true'
      }
    });
    execSync('npm rebuild sharp --build-from-source', { stdio: 'inherit' });
  }
};

exports.afterSign = exports.beforeBuild; 