#!/bin/bash
# 小龙虾 App - 三丰云一键部署脚本

echo "🚀 开始部署小龙虾 App..."

# 更新系统
apt-get update && apt-get upgrade -y

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 安装 PostgreSQL
apt-get install -y postgresql postgresql-contrib

# 启动 PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# 创建数据库和用户
sudo -u postgres psql <<EOF
CREATE DATABASE xiaolongxia;
CREATE USER xiaolongxia WITH PASSWORD 'xiaolongxia123';
ALTER ROLE xiaolongxia SET client_encoding TO 'utf8';
ALTER ROLE xiaolongxia SET default_transaction_isolation TO 'read committed';
ALTER ROLE xiaolongxia SET timezone TO 'Asia/Shanghai';
GRANT ALL PRIVILEGES ON DATABASE xiaolongxia TO xiaolongxia;
EOF

# 克隆代码
cd /var/www
rm -rf xiaolongxia-app
git clone https://github.com/liuliucomputer/xiaolongxia-app.git
cd xiaolongxia-app/output/deploy

# 安装依赖
npm install

# 创建环境变量
cat > .env <<EOF
DATABASE_URL=postgresql://xiaolongxia:xiaolongxia123@localhost:5432/xiaolongxia
PORT=3000
JWT_SECRET=xiaolongxia_secret_key_$(date +%s)
EOF

# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start server/index.js --name xiaolongxia
pm2 save
pm2 startup

# 开放端口
ufw allow 3000/tcp

echo "✅ 部署完成！"
echo "访问地址: http://你的服务器IP:3000"
echo ""
echo "常用命令:"
echo "  pm2 logs xiaolongxia    # 查看日志"
echo "  pm2 restart xiaolongxia # 重启服务"
echo "  pm2 stop xiaolongxia    # 停止服务"
