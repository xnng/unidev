#!/usr/bin/env node

const { spawn } = require('child_process');
const { version } = require('../package.json');

if (process.argv.includes('-v') || process.argv.includes('--version')) {
  console.log(`unidev v${version}`);
  process.exit(0);
}
const path = require('path');

const args = process.argv.slice(2);
const isBuild = args.includes('build');
const distPath = isBuild ? 'dist/build/mp-weixin' : 'dist/dev/mp-weixin';
const macosWeixinPath = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli';

let isFirstRun = true;

const packageManager = args[0] || 'pnpm';
const command = args[1] || 'dev';
const devProcess = spawn(packageManager, [command], {
  stdio: ['inherit', 'pipe', 'inherit']
});

devProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);

  if (output.includes('开始差量编译')) {
    isFirstRun = false;
  }

  if (isFirstRun && output.includes('Build complete')) {
    const projectPath = path.join(process.cwd(), distPath);
    spawn(macosWeixinPath, ['open', '--project', projectPath], {
      stdio: 'inherit'
    });
  }
});

devProcess.on('error', (error) => {
  console.error(`执行出错: ${error}`);
  process.exit(1);
});
