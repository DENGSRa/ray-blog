# RAY Blog

一个基于 React、Vite 和 Express 的个人博客，支持文章、书籍、相册、画廊与管理员后台。

## 本地开发

```bash
npm ci
npm run dev
```

## Docker 部署

1. 复制环境变量模板：`cp .env.example .env`
2. 设置 `DOMAIN`、`ACME_EMAIL`、`ADMIN_PASSWORD` 和 `ADMIN_PASSWORD_HASH`。
3. 启动：`docker compose up -d --build`

`data/content.json`、`public/uploads/` 和 `public/books/` 是运行时数据，已排除在公开仓库之外；部署时请从备份或旧服务器恢复。
