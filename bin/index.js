#!/usr/bin/env node

const { spawn } = require('child_process');
const { version } = require('../package.json');
const path = require('path');
const fs = require('fs-extra');
const readlineSync = require('readline-sync');
const os = require('os');

if (process.argv.includes('-v') || process.argv.includes('--version')) {
  console.log(`unidev v${version}`);
  process.exit(0);
}

const args = process.argv.slice(2);
const isBuild = args.includes('build');
const distPath = isBuild ? 'dist/build/mp-weixin' : 'dist/dev/mp-weixin';

// 配置文件路径
const configDir = path.join(os.homedir(), '.unidev');
const configPath = path.join(configDir, 'config.json');

// 获取微信开发者工具路径
const getWeixinPath = () => {
  // 确保配置目录存在
  fs.ensureDirSync(configDir);

  // 尝试读取配置文件
  let config = {};
  try {
    config = fs.readJsonSync(configPath);
  } catch (error) {
    config = {};
  }

  const isWindows = process.platform === 'win32';
  let weixinPath = config.weixinPath;

  // 如果没有保存的路径，使用默认路径
  if (!weixinPath) {
    weixinPath = isWindows
      ? 'C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat'
      : '/Applications/wechatwebdevtools.app/Contents/MacOS/cli';
  }

  // 检查路径是否存在
  if (!fs.existsSync(weixinPath)) {
    console.log('未找到微信开发者工具，请输入正确的路径：');
    console.log(isWindows 
      ? '提示：Windows 路径通常为：C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat'
      : '提示：MacOS 路径通常为：/Applications/wechatwebdevtools.app/Contents/MacOS/cli');
    
    weixinPath = readlineSync.question('请输入微信开发者工具的路径: ');
    
    // 检查用户输入的路径
    if (!fs.existsSync(weixinPath)) {
      console.error('输入的路径不存在，请检查后重试');
      process.exit(1);
    }

    // 保存配置
    fs.writeJsonSync(configPath, { ...config, weixinPath }, { spaces: 2 });
  }

  return weixinPath;
};

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
    const weixinPath = getWeixinPath();
    
    spawn(weixinPath, ['open', '--project', projectPath], {
      stdio: 'inherit',
      shell: process.platform === 'win32' // Windows 需要 shell 支持
    });
  }
});

devProcess.on('error', (error) => {
  console.error(`执行出错: ${error}`);
  process.exit(1);
});
