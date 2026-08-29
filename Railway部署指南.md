# 小龙虾 App - Railway 部署指南

## 部署步骤

### 1. 访问 Railway
打开 https://railway.app/

### 2. 登录
使用已登录的账号（liuliucomputer@gmail.com）

### 3. 新建项目
点击 "New Project" → "Deploy from GitHub repo"

### 4. 选择仓库
选择 `liuliucomputer/xiaolongxia-app`

### 5. 添加 PostgreSQL 数据库
在项目中：
- 点击 "+" 按钮
- 选择 "Database"
- 选择 "Add PostgreSQL"
- Railway 会自动提供 DATABASE_URL 环境变量

### 6. 配置环境变量
确保项目有以下环境变量：
```
DATABASE_URL=（PostgreSQL 会自动注入）
NODE_ENV=production
PORT=10000
```

### 7. 部署
点击 "Deploy" 按钮，等待部署完成

### 8. 获取访问地址
部署成功后，Railway 会给你一个类似 `https://xiaolongxia-app.onrender.com` 的地址

## 当前文件状态
- ✅ database.js: 已改为 PostgreSQL
- ✅ package.json: 包含 pg 依赖
- ✅ render.yaml: 配置完成
- ✅ .env: 示例配置
- ✅ index.html: 已修复冲突

## 前端 API 地址
前端已配置为相对路径 `/api`，部署后会自动指向正确的后端地址。
