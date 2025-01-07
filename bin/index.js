#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const isBuild = args.includes('build');
const distPath = isBuild ? 'dist/build/mp-weixin' : 'dist/dev/mp-weixin';
const macosWeixinPath = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli';

const pnpmDev = spawn('pnpm', ['dev'], {
  stdio: ['inherit', 'pipe', 'inherit']
});

pnpmDev.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);

  if (output.includes('Build complete')) {
    const projectPath = path.join(process.cwd(), distPath);
    spawn(macosWeixinPath, ['open', '--project', projectPath], {
      stdio: 'inherit'
    });
  }
});

pnpmDev.on('error', (error) => {
  console.error(`执行出错: ${error}`);
  process.exit(1);
});
