# 小龙虾 App - Render 部署指南

## 步骤 1: 准备 GitHub 仓库
确保代码已推送到 GitHub:
```bash
cd "C:/Users/liuliucomputer/WorkBuddy/小龙虾/output/deploy"
git add .
git commit -m "准备 Render 部署"
git push origin main
```

## 步骤 2: 登录 Render
访问 https://render.com 使用 GitHub 账号登录（无需绑卡）

## 步骤 3: 部署服务
1. 点击 "New +" → "Public Service"
2. 连接 GitHub 仓库: liuliucomputer/xiaolongxia-app
3. 选择分支: main
4. 设置:
   - Name: xiaolongxia-api
   - Root Directory: output/deploy
   - Build Command: npm install
   - Start Command: npm start
5. 点击 "Create Public Service"

## 步骤 4: 添加数据库
1. 点击 "New +" → "PostgreSQL"
2. 名称: xiaolongxia-db
3. 点击 "Create Database"
4. 复制 DATABASE_URL（格式: postgres://...）

## 步骤 5: 配置环境变量
1. 回到服务页面 → "Environment" 标签
2. 添加变量:
   - Key: DATABASE_URL
   - Value: [从步骤4复制的URL]
3. 点击 "Save Changes"

## 步骤 6: 触发重新部署
服务会自动检测到变更并重新部署，等待状态变为 "Operational"

## 访问地址
部署完成后，服务地址格式: https://xiaolongxia-api.onrender.com
