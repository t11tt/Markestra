# Markestra · 开发说明

最新功能与模板预览见 [仓库 README](../README.md)。`package.json` 保留最近标记版本 `0.3.0`，当前 `main` 包含其后的开发更新。

## 本机启动

需要 Node.js 20.9+ 和 npm；已在 Node.js 22 下验证。在本目录执行：

```bash
npm install
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。开发脚本自动启动 PGlite PostgreSQL（`127.0.0.1:5433`）、生成 Prisma 客户端、应用迁移与写入种子数据。重启开发服务器会保留已有数据，并应用新增迁移。

- `.env`：本机配置，开发脚本补写 `DATABASE_URL` 并保留其他环境变量。
- `data/pglite/`：本机数据库。
- `data/files/`：上传图片与导出海报。

以上配置和数据不进入 Git。同事克隆项目后使用同样的启动命令即可初始化自己的演示环境；本次交互中创建的账号、活动和订单不会随源码同步。

## 文案 API

在 `.env` 设置以下服务端变量并重启：

```dotenv
DEEPSEEK_API_KEY=你的密钥
DEEPSEEK_MODEL=deepseek-flash
```

DeepSeek 使用 `https://api.deepseek.com/chat/completions`。生成记录保留模型、提示词版本、输入快照、文案版本与事实提醒；接口失败会报错，不会冒充真实生成成功。没有配置模型密钥时可使用本地演示生成。

兼容已有千问配置：`DASHSCOPE_API_KEY`、可选 `DASHSCOPE_MODEL` 与 `DASHSCOPE_BASE_URL`。两种提供商同时配置时优先使用 DeepSeek。

## 海报模板

- `src/lib/poster-templates.ts`：五套场景模板与四套经典配色的清单、路径和轮换逻辑。
- `src/lib/poster.ts`：预览与导出共用的 Canvas 排版。
- `public/poster-backgrounds/`：应用使用的优化 WebP。
- `design/poster-backgrounds/`：imagegen 原始 PNG、生成提示词与海报效果对照图。
- `public/demo/tea-editorial.png`：AI 茶点演示配图。

五套背景为预生成资产，不需要用户配置图片模型密钥，也不会在每次生成时调用图片 API。商家上传照片后由代码进行取景和排版。完整或单渠道生成成功后选择不同于当前背景的新模板；手动选择保存在 `Campaign.posterStyle`。

模板选择器将「场景模板」和「经典配色」分开，支持响应式缩略图、选中标记和当前选择提示。确认各渠道文案后，可将所有 PNG 和 TXT 文案打包为 ZIP 导出。

## 商品、购物车与库存

商品支持编辑、上传实拍、上下架及设置库存。购物车按店铺保存在浏览器本地。下单以服务端价格计价，通过事务与库存条件更新避免超卖；取消订单只返库一次，已完成及已取消订单不可倒退。首次库存迁移与新增商品默认值为 100，请按实际情况调整。

支付和物流尚未连接真实服务。开发脚本面向本机演示；`npm run build` 验证编译，正式运行还需配置可持续运行的数据库、文件存储及相关外部服务。

## 检查与验收

```bash
npm test
npm run lint
npm run build
```

开发服务器启动后：

```bash
npm run test:commerce
```

该脚本创建独立临时账号和店铺，验证并发扣库存、取消幂等返库、终态限制、非法数量及账号隔离，结束后清理该临时店铺。

以下两个脚本使用演示账号创建或更新演示活动，并调用已配置的模型 API，可能产生 API 费用：

```bash
node scripts/verify-generation.mjs
node scripts/verify-poster-templates.mjs
```

前者验证三渠道真实文案生成与保存；后者验证五套模板的保存、刷新保留、非法模板拒绝，以及两次生成不连续使用同一背景。
