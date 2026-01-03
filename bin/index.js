#!/usr/bin/env node

const { spawn, execSync } = require('child_process')
const { version } = require('../package.json')
const path = require('path')
const fs = require('fs-extra')
const os = require('os')

// 默认微信开发者工具路径
const DEFAULT_WEIXIN_CLI = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'

// 平台配置
const PLATFORMS = {
  'mp-weixin': {
    name: '微信',
    distDir: 'mp-weixin',
  },
  'mp-alipay': {
    name: '支付宝',
    distDir: 'mp-alipay',
  },
}

/**
 * 从命令中检测平台
 */
function detectPlatform(args) {
  const commandStr = args.join(' ')

  if (commandStr.includes('mp-weixin')) {
    return 'mp-weixin'
  }
  if (commandStr.includes('mp-alipay')) {
    return 'mp-alipay'
  }
  return null
}

/**
 * 解析命令行参数
 */
function parseArgs(args) {
  const result = {
    packageManager: 'pnpm',
    command: null,
    cwd: process.cwd(),
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--cwd' && args[i + 1]) {
      result.cwd = path.resolve(args[i + 1])
      i++
    } else if (!result.command && (arg === 'pnpm' || arg === 'npm' || arg === 'yarn')) {
      result.packageManager = arg
      if (args[i + 1]) {
        result.command = args[i + 1]
        i++
      }
    } else if (!result.command) {
      result.command = arg
    }
  }

  return result
}

/**
 * 加载配置文件
 */
function loadConfig(projectDir) {
  const configLocations = [
    path.join(projectDir, '.unidevrc.json'),
    path.join(os.homedir(), '.unidevrc.json'),
  ]

  for (const configPath of configLocations) {
    if (fs.existsSync(configPath)) {
      try {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      } catch (e) {
        console.warn(`警告: 配置文件 ${configPath} 解析失败`)
      }
    }
  }

  return {}
}

/**
 * 获取微信开发者工具路径
 */
function getWeixinToolPath(config) {
  if (config.toolPaths && config.toolPaths.wx) {
    return config.toolPaths.wx
  }
  return DEFAULT_WEIXIN_CLI
}

/**
 * 检查 minidev 是否已安装
 */
function checkMinidevInstalled() {
  try {
    execSync('which minidev', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * 打印帮助信息
 */
function printHelp() {
  console.log(`
unidev v${version} - UniApp 开发者工具启动器

用法:
  unidev <package-manager> <command> [options]

选项:
  --cwd <path>    指定项目目录（默认为当前目录）
  -v, --version   显示版本号
  -h, --help      显示帮助信息

示例:
  unidev pnpm dev:mp-weixin                         # 启动微信小程序开发
  unidev pnpm dev:mp-alipay                         # 启动支付宝小程序开发
  unidev pnpm build:mp-weixin                       # 构建微信小程序
  unidev pnpm dev:mp-weixin --cwd ./apps/myApp      # 指定项目目录

平台自动识别:
  工具会根据命令中的 mp-weixin 或 mp-alipay 自动识别目标平台

配置文件 (.unidevrc.json):
  可在项目目录或用户目录下创建配置文件来自定义工具路径:
  {
    "toolPaths": {
      "wx": "/path/to/wechat/devtools/cli"
    }
  }

前置要求:
  微信小程序: 安装微信开发者工具
  支付宝小程序: 安装 minidev CLI (npm i -g minidev)
`)
}

/**
 * 打开微信开发者工具
 */
function openWeixinDevTool(projectPath, toolPath) {
  if (!fs.existsSync(toolPath)) {
    console.error('')
    console.error('❌ 未找到微信开发者工具')
    console.error('')
    console.error(`   预期路径: ${toolPath}`)
    console.error('')
    console.error('   解决方案:')
    console.error(
      '   1. 安装微信开发者工具: https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html'
    )
    console.error('   2. 或通过 .unidevrc.json 配置自定义路径')
    console.error('')
    return
  }

  console.log('正在打开微信开发者工具...')
  console.log(`项目路径: ${projectPath}`)

  // 使用 detached 模式让子进程独立运行，避免父进程退出时影响子进程
  const child = spawn(toolPath, ['open', '--project', projectPath], {
    stdio: 'ignore',
    detached: true,
  })
  child.unref()
}

/**
 * 打开支付宝开发者工具
 */
function openAlipayDevTool(projectPath) {
  if (!checkMinidevInstalled()) {
    console.error('')
    console.error('❌ 未安装 minidev CLI')
    console.error('')
    console.error('   支付宝小程序开发需要全局安装 minidev 命令行工具')
    console.error('')
    console.error('   安装方法:')
    console.error('   npm i -g minidev')
    console.error('')
    console.error('   安装完成后重新运行此命令即可')
    console.error('')
    return
  }

  console.log('正在打开支付宝开发者工具...')
  console.log(`项目路径: ${projectPath}`)

  // 使用 detached 模式让子进程独立运行
  const child = spawn('minidev', ['ide', '-p', projectPath], {
    stdio: 'ignore',
    detached: true,
  })
  child.unref()
}

/**
 * 打开开发者工具
 */
function openDevTool(platform, projectPath, config) {
  if (platform === 'mp-weixin') {
    const toolPath = getWeixinToolPath(config)
    openWeixinDevTool(projectPath, toolPath)
  } else if (platform === 'mp-alipay') {
    openAlipayDevTool(projectPath)
  }
}

// 主程序入口
function main() {
  const args = process.argv.slice(2)

  // 版本号
  if (args.includes('-v') || args.includes('--version')) {
    console.log(`unidev v${version}`)
    process.exit(0)
  }

  // 帮助信息
  if (args.includes('-h') || args.includes('--help') || args.length === 0) {
    printHelp()
    process.exit(0)
  }

  const parsed = parseArgs(args)
  const platform = detectPlatform(args)

  // 验证平台
  if (!platform) {
    console.error('错误: 无法识别目标平台')
    console.error('命令中需包含 mp-weixin 或 mp-alipay')
    console.error('示例: unidev pnpm dev:mp-weixin')
    process.exit(1)
  }

  // 验证命令
  if (!parsed.command) {
    console.error('错误: 请指定要执行的命令')
    console.error('使用 unidev --help 查看帮助信息')
    process.exit(1)
  }

  // 验证项目目录
  if (!fs.existsSync(parsed.cwd)) {
    console.error(`错误: 项目目录不存在: ${parsed.cwd}`)
    process.exit(1)
  }

  // 加载配置
  const config = loadConfig(parsed.cwd)
  const platformConfig = PLATFORMS[platform]
  const isBuild = parsed.command.includes('build')
  const distType = isBuild ? 'build' : 'dev'
  const distPath = path.join(parsed.cwd, 'dist', distType, platformConfig.distDir)

  console.log(`平台: ${platformConfig.name}小程序`)
  console.log(`项目目录: ${parsed.cwd}`)
  console.log(`执行命令: ${parsed.packageManager} ${parsed.command}`)
  console.log('')

  let isFirstRun = true

  const devProcess = spawn(parsed.packageManager, [parsed.command], {
    cwd: parsed.cwd,
    stdio: ['inherit', 'pipe', 'inherit'],
  })

  devProcess.stdout.on('data', (data) => {
    const output = data.toString()
    console.log(output)

    // 差量编译表示不是首次运行
    if (output.includes('开始差量编译')) {
      isFirstRun = false
    }

    // 首次构建完成时打开开发者工具
    if (isFirstRun && output.includes('Build complete')) {
      openDevTool(platform, distPath, config)
    }
  })

  devProcess.on('error', (error) => {
    console.error(`执行出错: ${error}`)
    process.exit(1)
  })

  devProcess.on('close', (code) => {
    process.exit(code)
  })
}

main()
