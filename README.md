# @xnng/unidev

一个用于快速启动微信小程序开发的命令行工具。

## 安装

```bash
npm install -g @xnng/unidev
# 或者
pnpm add -g @xnng/unidev
```

## 使用

在你的 uniapp 项目目录下：

```bash
# 开发环境
unidev npm run dev:mp-weixin

# 构建环境（使用 dist/build/mp-weixin 目录）
unidev npm run build:mp-weixin
```

## 功能

- 检测到构建完成后自动打开微信开发者工具
- 支持通过 build 参数切换目标目录

## 要求

- macOS 系统
- 已安装微信开发者工具
- Node.js >= 14
