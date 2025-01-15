#!/usr/bin/env node

const { spawn } = require('child_process');
const { version } = require('../package.json');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

if (process.argv.includes('-v') || process.argv.includes('--version')) {
  console.log(`unidev v${version}`);
  process.exit(0);
}

const args = process.argv.slice(2);
const isBuild = process.argv.some(arg => arg.includes('build'));
const distPath = isBuild ? 'dist/build/mp-weixin' : 'dist/dev/mp-weixin';
const weixinPath = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli';

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
    
    if (!fs.existsSync(weixinPath)) {
      console.error('未找到微信开发者工具，请确保已安装微信开发者工具');
      process.exit(1);
    }

    spawn(weixinPath, ['open', '--project', projectPath], {
      stdio: 'inherit'
    });
  }
});

devProcess.on('error', (error) => {
  console.error(`执行出错: ${error}`);
  process.exit(1);
});
