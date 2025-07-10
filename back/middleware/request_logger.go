package middleware

import (
	"github.com/gin-gonic/gin"
	"log"
	"time"
)

// RequestLogger 记录每个请求的基本信息
func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		method := c.Request.Method
		c.Next()
		cost := time.Since(start)
		log.Printf("%s %s | %d | %v", method, path, c.Writer.Status(), cost)
	}
}
