此项目是一个酒店招聘管理平台，旨在帮助酒店轻松管理职位发布和应聘流程。

- **前端**：基于 [Remix](https://remix.run/) 开发，提供高效的用户体验。
- **数据库**：使用 MongoDB 作为数据存储，配合 [Prisma ORM](https://www.prisma.io/) 进行数据库操作。

---

## 先决条件

在开始运行此项目之前，请确保你的环境中已安装以下工具：

- Node.js >= 16.x
- npm 或 yarn
- MongoDB Community Edition >= 5.x

---

## 安装步骤

配置项目依赖

    1.	安装依赖：

npm install

    2.	配置环境变量：

在项目根目录创建 .env 文件，添加以下内容：

DATABASE_URL="mongodb://localhost:27017/recruit?replicaSet=rs0"
SESSION_SECRET=YOUR_SESSION_SECRET
AWS_S3_BUCKET_NAME=YOUR_BUCKET_NAME
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY
AWS_REGION=YOUR_REGION

请确保 DATABASE_URL 指向你的 MongoDB 实例，并包含 replicaSet=rs0 参数。

配置 MongoDB 复制集

Prisma 需要 MongoDB 启用了复制集才能正常工作。以下是启用复制集的步骤： 1. 停止当前 MongoDB 服务（如果运行中）：

brew services stop mongodb-community

    2.	手动启动 MongoDB 并启用复制集：

mongod --dbpath /usr/local/var/mongodb --replSet rs0

--replSet rs0 指定了复制集名称为 rs0。

    3.	初始化复制集：

打开新的终端窗口，连接到 MongoDB：

mongo

然后运行以下命令：

rs.initiate()

    4.	验证复制集状态：

在 Mongo Shell 中运行：

rs.status()

如果 ok: 1，表示复制集已成功启用。

运行项目

    1.	启动开发服务器：

npm run dev

    2.	打开浏览器访问：

http://localhost:5173

故障排查

常见问题 1：MongoDB 无法连接

    •	确认 MongoDB 服务已运行并启用了复制集。
    •	检查 .env 文件中 DATABASE_URL 是否正确配置。

常见问题 2：PrismaClientKnownRequestError

    •	请确认已运行以下命令以同步数据库模式：

npx prisma migrate dev
