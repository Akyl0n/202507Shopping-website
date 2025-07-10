package routes

import (
	"context"
	"strconv"
	"time"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
)

// 订单状态统计接口
func RegisterOrderCountsRoute(r *gin.Engine, pool *pgxpool.Pool) {
	r.GET("/api/order/counts", func(c *gin.Context) {
		session := sessions.Default(c)
		username, ok := session.Get("user").(string)
		if !ok || username == "" {
			c.JSON(401, gin.H{"error": "未登录"})
			return
		}
		// 查询用户id
		var userID int
		err := pool.QueryRow(context.Background(), "SELECT id FROM users WHERE username=$1", username).Scan(&userID)
		if err != nil {
			c.JSON(500, gin.H{"error": "用户不存在"})
			return
		}
		// 查询订单状态数量
		rows, err := pool.Query(context.Background(), "SELECT status, COUNT(*) FROM orders WHERE user_id=$1 GROUP BY status", userID)
		if err != nil {
			c.JSON(500, gin.H{"error": "数据库错误"})
			return
		}
		defer rows.Close()
		counts := map[string]int{"pending": 0, "toship": 0, "toreceive": 0, "toreview": 0, "refund": 0}
		for rows.Next() {
			var status string
			var count int
			if err := rows.Scan(&status, &count); err == nil {
				counts[status] = count
			}
		}
		c.JSON(200, counts)
	})
}

// 订单列表接口
func RegisterOrderListRoute(r *gin.Engine, pool *pgxpool.Pool) {
	r.GET("/api/order/list", func(c *gin.Context) {
		session := sessions.Default(c)
		username, ok := session.Get("user").(string)
		if !ok || username == "" {
			c.JSON(401, gin.H{"error": "未登录"})
			return
		}
		var userID int
		err := pool.QueryRow(context.Background(), "SELECT id FROM users WHERE username=$1", username).Scan(&userID)
		if err != nil {
			c.JSON(500, gin.H{"error": "用户不存在"})
			return
		}
		status := c.Query("status")
		var rows pgx.Rows
		if status != "" {
			rows, err = pool.Query(context.Background(),
				`SELECT o.id, o.status, o.total_price, o.address, o.created_at, o.updated_at, COUNT(oi.id) as item_count
				 FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id
				 WHERE o.user_id=$1 AND o.status=$2 GROUP BY o.id ORDER BY o.created_at DESC`,
				userID, status)
		} else {
			rows, err = pool.Query(context.Background(),
				`SELECT o.id, o.status, o.total_price, o.address, o.created_at, o.updated_at, COUNT(oi.id) as item_count
				 FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id
				 WHERE o.user_id=$1 GROUP BY o.id ORDER BY o.created_at DESC`,
				userID)
		}
		if err != nil {
			c.JSON(500, gin.H{"error": "数据库错误"})
			return
		}
		defer rows.Close()
		var orders []gin.H
		for rows.Next() {
			var id int
			var status, address string
			var totalPrice float64
			var createdAt, updatedAt time.Time
			var itemCount int
			err := rows.Scan(&id, &status, &totalPrice, &address, &createdAt, &updatedAt, &itemCount)
			if err != nil {
				continue
			}
			orders = append(orders, gin.H{
				"id":          id,
				"status":      status,
				"total_price": totalPrice,
				"address":     address,
				"created_at":  createdAt.Format("2006-01-02 15:04:05"),
				"updated_at":  updatedAt.Format("2006-01-02 15:04:05"),
				"item_count":  itemCount,
			})
		}
		c.JSON(200, orders)
	})
}

// 订单创建接口
func RegisterOrderCreateRoute(r *gin.Engine, pool *pgxpool.Pool) {
	type CreateOrderRequest struct {
		Items []struct {
			ProductID int     `json:"product_id"`
			ModelID   int     `json:"model_id"`
			Quantity  int     `json:"quantity"`
			Price     float64 `json:"price"`
		} `json:"items"`
		Address string  `json:"address"`
		Total   float64 `json:"total"`
	}
	r.POST("/api/order/create", func(c *gin.Context) {
		session := sessions.Default(c)
		username, ok := session.Get("user").(string)
		if !ok || username == "" {
			c.JSON(401, gin.H{"error": "未登录"})
			return
		}
		var userID int
		err := pool.QueryRow(context.Background(), "SELECT id FROM users WHERE username=$1", username).Scan(&userID)
		if err != nil {
			c.JSON(500, gin.H{"error": "用户不存在"})
			return
		}
		var req CreateOrderRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": "参数错误"})
			return
		}
		tx, err := pool.Begin(context.Background())
		if err != nil {
			c.JSON(500, gin.H{"error": "数据库错误"})
			return
		}
		defer tx.Rollback(context.Background())
		var orderID int
		err = tx.QueryRow(context.Background(),
			`INSERT INTO orders (user_id, status, total_price, address, created_at, updated_at)
			 VALUES ($1, 'pending', $2, $3, NOW(), NOW()) RETURNING id`,
			userID, req.Total, req.Address).Scan(&orderID)
		if err != nil {
			c.JSON(500, gin.H{"error": "下单失败"})
			return
		}
		for _, item := range req.Items {
			_, err := tx.Exec(context.Background(),
				`INSERT INTO order_items (order_id, product_id, model_id, quantity, price)
				 VALUES ($1, $2, $3, $4, $5)`,
				orderID, item.ProductID, item.ModelID, item.Quantity, item.Price)
			if err != nil {
				c.JSON(500, gin.H{"error": "下单失败"})
				return
			}
		}
		if err := tx.Commit(context.Background()); err != nil {
			c.JSON(500, gin.H{"error": "数据库提交失败"})
			return
		}
		c.JSON(200, gin.H{"success": true, "order_id": orderID})
	})
}

// 订单详情接口
func RegisterOrderDetailRoute(r *gin.Engine, pool *pgxpool.Pool) {
	r.GET("/api/order/detail", func(c *gin.Context) {
		session := sessions.Default(c)
		username, ok := session.Get("user").(string)
		if !ok || username == "" {
			c.JSON(401, gin.H{"error": "未登录"})
			return
		}
		var userID int
		err := pool.QueryRow(context.Background(), "SELECT id FROM users WHERE username=$1", username).Scan(&userID)
		if err != nil {
			c.JSON(500, gin.H{"error": "用户不存在"})
			return
		}
		orderIDStr := c.Query("id")
		orderID, err := strconv.Atoi(orderIDStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "订单ID格式错误"})
			return
		}
		var id int
		var status, address string
		var totalPrice float64
		var createdAt, updatedAt time.Time
		err = pool.QueryRow(context.Background(),
			`SELECT id, status, total_price, address, created_at, updated_at FROM orders WHERE id=$1 AND user_id=$2`,
			orderID, userID).Scan(&id, &status, &totalPrice, &address, &createdAt, &updatedAt)
		if err != nil {
			c.JSON(404, gin.H{"error": "订单不存在"})
			return
		}
		rows, err := pool.Query(context.Background(),
			`SELECT product_id, model_id, quantity, price FROM order_items WHERE order_id=$1`, orderID)
		if err != nil {
			c.JSON(500, gin.H{"error": "查询明细失败"})
			return
		}
		defer rows.Close()
		var items []gin.H
		for rows.Next() {
			var productID, modelID, quantity int
			var price float64
			if err := rows.Scan(&productID, &modelID, &quantity, &price); err == nil {
				items = append(items, gin.H{
					"product_id": productID,
					"model_id":   modelID,
					"quantity":   quantity,
					"price":      price,
				})
			}
		}
		c.JSON(200, gin.H{
			"id":          id,
			"status":      status,
			"total_price": totalPrice,
			"address":     address,
			"created_at":  createdAt.Format("2006-01-02 15:04:05"),
			"updated_at":  updatedAt.Format("2006-01-02 15:04:05"),
			"items":       items,
		})
	})
}
