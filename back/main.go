package main

import (
	"back/middleware"
	"back/routes"
	"context"
	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4/pgxpool"
	"log"
	"net"
)

func main() {
	r := gin.Default()

	// 全局请求日志中间件
	r.Use(middleware.RequestLogger())

	// 跨域配置
	r.Use(cors.Default())

	// session 配置
	store := cookie.NewStore([]byte("secret"))
	store.Options(sessions.Options{
		Path:     "/",
		HttpOnly: true,
		Secure:   false, // 应该要true，本地就不管了
		SameSite: 0,
	})
	r.Use(sessions.Sessions("mysession", store))

	// 数据库连接
	dbUrl := "postgres://postgres:123456@localhost:5432/202507program"
	pool, err := pgxpool.Connect(context.Background(), dbUrl)
	if err != nil {
		log.Fatalf("无法连接数据库: %v", err)
	}
	defer pool.Close()

	// 注册路由
	routes.RegisterRoutes(r, pool)

	// listen 端口
	listener, err := net.Listen("tcp", ":8080")
	if err != nil {
		log.Fatalf("监听端口失败: %v", err)
	}
	r.RunListener(listener)
}
