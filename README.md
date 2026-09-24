# Markestra

大家克隆后，在 `web` 目录执行：

```bash
npm install
npm run dev
```

然后打开 http://localhost:3000 。`npm run dev` 会启动本机数据库、写入表结构，并放入同一套演示店铺、活动、发布记录和复盘。不需要单独安装 PostgreSQL，也不要拷贝别人电脑上的数据库文件。

本地数据库在 `web/data`，千问密钥在 `web/.env`。这两处都不要提交。没有密钥时，文案生成使用本地演示结果。更多说明见 `web/README.md`。

## Current implementation

The runnable workspace lives in `web/`. A merchant can keep brand and product facts, plan a campaign, draft channel copy, confirm and export a poster, record a publication, enter or import metrics, and write a review that starts the next round. Demo rows are labeled separately from real metrics. Exporting a poster does not publish it, and the review does not treat metric changes as proof of sales.

The first version does not post to Xiaohongshu, WeChat, or Douyin, and it does not scrape platform data.
