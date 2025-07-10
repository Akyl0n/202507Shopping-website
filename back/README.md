# 电商网站后端（Go + Gin + PostgreSQL）

## 简介
本项目为电商网站后端，基于 Gin 框架，支持会话管理和跨域，使用 PostgreSQL 作为数据库。

## 主要技术栈
- Gin（Web 框架）
- gin-contrib/sessions（会话管理）
- gin-contrib/cors（跨域支持）
- PostgreSQL（数据库）
- pgx（PostgreSQL 驱动）

## 数据库配置
- 用户名：postgres
- 密码：123456
- 主机：localhost
- 端口：5432
- 数据库名称：2025program

## 启动方式
1. 确保 PostgreSQL 数据库已启动并创建好数据库。
2. 安装依赖：
   ```sh
   go mod tidy
   ```
3. 启动服务：
   ```sh
   go run main.go
   ```
4. 访问测试接口：
   http://localhost:8080/ping

## 目录结构
- main.go：主程序入口
- go.mod：依赖管理
- .github/copilot-instructions.md：Copilot 指令

## TODO
- 用户注册/登录接口
- 商品管理接口
- 购物车与订单接口
