# Markestra

本地营销工作台。店铺、商品和活动保存在本机 PostgreSQL 里，刷新或重启后仍然在。

## 启动

在 `web` 目录执行：

```bash
npm install
npm run dev
```

`npm run dev` 会启动本地 PostgreSQL、写入表结构、放入演示资料，然后打开 http://localhost:3000 。不需要单独安装数据库。

同事克隆后执行同样两条命令即可看到完整演示：店铺、商品、活动、发布记录、演示结果和复盘都由种子数据写入。本地数据库文件在 `web/data`，不要提交；仓库里的迁移和种子就是共享的数据内容。

复制 `web/.env.example` 为 `web/.env` 不是必须的，`npm run dev` 会补上 `DATABASE_URL`。千问密钥写在 `DASHSCOPE_API_KEY`，没有密钥时使用本地演示生成。不要把 `.env` 或 `web/data` 提交上去。

线上预览地址 https://markestra.pages.dev/ 还是之前的静态页面，不连这套数据库。
