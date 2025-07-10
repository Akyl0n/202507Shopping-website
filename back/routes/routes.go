package routes

import (
	"context"
	"fmt"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
)

func RegisterRoutes(r *gin.Engine, pool *pgxpool.Pool) {
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	// 统一注册 /api 路由组
	api := r.Group("/api")
	{
		api.POST("/register", func(c *gin.Context) {
			type RegisterRequest struct {
				Username string `json:"username"`
				Password string `json:"password"`
				Nickname string `json:"nickname"`
				Address  string `json:"address"`
			}
			var req RegisterRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(400, gin.H{"error": "参数错误"})
				return
			}
			if req.Username == "" || req.Password == "" {
				c.JSON(400, gin.H{"error": "用户名和密码不能为空"})
				return
			}
			var exists bool
			err := pool.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM users WHERE username=$1)", req.Username).Scan(&exists)
			if err != nil {
				c.JSON(500, gin.H{"error": "数据库错误"})
				return
			}
			if exists {
				c.JSON(400, gin.H{"error": "用户名已存在"})
				return
			}
			_, err = pool.Exec(context.Background(),
				"INSERT INTO users (username, password, nickname, address) VALUES ($1, $2, $3, $4)",
				req.Username, req.Password, req.Nickname, req.Address)
			if err != nil {
				c.JSON(500, gin.H{"error": "注册失败"})
				return
			}
			c.JSON(200, gin.H{"message": "注册成功"})
		})

		api.POST("/login", func(c *gin.Context) {
			type LoginRequest struct {
				Username string `json:"username"`
				Password string `json:"password"`
			}
			var req LoginRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(400, gin.H{"error": "参数错误"})
				return
			}
			var dbPassword string
			err := pool.QueryRow(context.Background(), "SELECT password FROM users WHERE username=$1", req.Username).Scan(&dbPassword)
			if err != nil {
				c.JSON(400, gin.H{"error": "用户名或密码错误"})
				return
			}
			if dbPassword != req.Password {
				c.JSON(400, gin.H{"error": "用户名或密码错误"})
				return
			}
			session := sessions.Default(c)
			session.Set("user", req.Username)
			session.Save()
			c.JSON(200, gin.H{"message": "登录成功"})
		})

		api.GET("/user/address", func(c *gin.Context) {
			session := sessions.Default(c)
			username, ok := session.Get("user").(string)
			if !ok || username == "" {
				c.JSON(401, gin.H{"error": "未登录"})
				return
			}
			var address string
			err := pool.QueryRow(context.Background(), "SELECT address FROM users WHERE username=$1", username).Scan(&address)
			if err != nil {
				c.JSON(500, gin.H{"error": "数据库错误"})
				return
			}
			c.JSON(200, gin.H{"address": address})
		})

		api.POST("/user/address", func(c *gin.Context) {
			session := sessions.Default(c)
			username, ok := session.Get("user").(string)
			if !ok || username == "" {
				c.JSON(401, gin.H{"error": "未登录"})
				return
			}
			type AddrReq struct {
				Address string `json:"address"`
			}
			var req AddrReq
			if err := c.ShouldBindJSON(&req); err != nil || req.Address == "" {
				c.JSON(400, gin.H{"error": "参数错误"})
				return
			}
			_, err := pool.Exec(context.Background(), "UPDATE users SET address=$1 WHERE username=$2", req.Address, username)
			if err != nil {
				c.JSON(500, gin.H{"error": "保存失败"})
				return
			}
			c.JSON(200, gin.H{"message": "保存成功"})
		})

		// 头像上传接口
		api.POST("/user/avatar", func(c *gin.Context) {
			session := sessions.Default(c)
			username, ok := session.Get("user").(string)
			if !ok || username == "" {
				c.JSON(401, gin.H{"error": "未登录"})
				return
			}
			file, err := c.FormFile("avatar")
			if err != nil {
				c.JSON(400, gin.H{"error": "未选择文件"})
				return
			}
			// 生成唯一文件名
			filename := "avatar_" + username + "_" + file.Filename
			path := "uploads/" + filename
			if err := c.SaveUploadedFile(file, path); err != nil {
				c.JSON(500, gin.H{"error": "保存失败"})
				return
			}
			// 更新数据库
			_, err = pool.Exec(context.Background(), "UPDATE users SET avatar=$1 WHERE username=$2", "/"+path, username)
			if err != nil {
				c.JSON(500, gin.H{"error": "数据库错误"})
				return
			}
			c.JSON(200, gin.H{"message": "上传成功", "avatar": "/" + path})
		})

		// 静态文件服务，提供头像图片访问
		r.Static("/uploads", "uploads")

		// 用户信息接口
		api.GET("/user/profile", func(c *gin.Context) {
			session := sessions.Default(c)
			username, ok := session.Get("user").(string)
			if !ok || username == "" {
				c.JSON(401, gin.H{"success": false, "message": "未登录"})
				return
			}
			var nickname, address, avatar string
			err := pool.QueryRow(context.Background(), "SELECT nickname, address, avatar FROM users WHERE username=$1", username).Scan(&nickname, &address, &avatar)
			if err != nil {
				_ = pool.QueryRow(context.Background(), "SELECT address, avatar FROM users WHERE username=$1", username).Scan(&address, &avatar)
				nickname = username
			}
			c.JSON(200, gin.H{
				"success":  true,
				"nickname": nickname,
				"address":  address,
				"avatar":   avatar,
			})
		})

		// 昵称修改接口
		api.POST("/user/nickname", func(c *gin.Context) {
			session := sessions.Default(c)
			username, ok := session.Get("user").(string)
			if !ok || username == "" {
				c.JSON(401, gin.H{"success": false, "message": "未登录"})
				return
			}
			type NickReq struct {
				Nickname string `json:"nickname"`
			}
			var req NickReq
			if err := c.ShouldBindJSON(&req); err != nil || req.Nickname == "" {
				c.JSON(400, gin.H{"success": false, "message": "参数错误"})
				return
			}
			_, err := pool.Exec(context.Background(), "UPDATE users SET nickname=$1 WHERE username=$2", req.Nickname, username)
			if err != nil {
				c.JSON(500, gin.H{"success": false, "message": "保存失败"})
				return
			}
			c.JSON(200, gin.H{"success": true, "message": "保存成功"})
		})

		// 商品列表接口（支持分类筛选，返回主信息+首图+最低价+销量）
		api.GET("/products", func(c *gin.Context) {
			category := c.Query("category")
			var rows pgx.Rows
			var err error
			if category != "" {
				rows, err = pool.Query(context.Background(), `SELECT p.id, p.title, p.category, COALESCE(MIN(m.price),0) as min_price, COALESCE(img.url,''), COALESCE(SUM(m.stock),0)
					FROM products p
					LEFT JOIN product_models m ON p.id = m.product_id
					LEFT JOIN product_images img ON p.id = img.product_id AND img.id = (
						SELECT id FROM product_images WHERE product_id = p.id LIMIT 1)
					WHERE p.category=$1
					GROUP BY p.id, img.url
					ORDER BY p.id DESC`, category)
			} else {
				rows, err = pool.Query(context.Background(), `SELECT p.id, p.title, p.category, COALESCE(MIN(m.price),0) as min_price, COALESCE(img.url,''), COALESCE(SUM(m.stock),0)
					FROM products p
					LEFT JOIN product_models m ON p.id = m.product_id
					LEFT JOIN product_images img ON p.id = img.product_id AND img.id = (
						SELECT id FROM product_images WHERE product_id = p.id LIMIT 1)
					GROUP BY p.id, img.url
					ORDER BY p.id DESC`)
			}
			if err != nil {
				c.JSON(500, gin.H{"error": "数据库错误"})
				return
			}
			defer rows.Close()
			products := []gin.H{}
			for rows.Next() {
				var id int
				var title, category, img string
				var minPrice float64
				var stock int
				if err := rows.Scan(&id, &title, &category, &minPrice, &img, &stock); err == nil {
					products = append(products, gin.H{
						"id": id, "title": title, "category": category, "price": minPrice, "img": img, "stock": stock,
					})
				}
			}
			c.JSON(200, gin.H{"products": products})
		})

		// 商品详情接口（含图片、型号、评价）
		api.GET("/products/:id", func(c *gin.Context) {
			idStr := c.Param("id")
			var id int
			if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
				c.JSON(400, gin.H{"error": "参数错误"})
				return
			}
			var title, category, description string
			err := pool.QueryRow(context.Background(), "SELECT title, category, description FROM products WHERE id=$1", id).Scan(&title, &category, &description)
			if err != nil {
				c.JSON(404, gin.H{"error": "商品不存在"})
				return
			}
			// 图片
			imgRows, _ := pool.Query(context.Background(), "SELECT url FROM product_images WHERE product_id=$1", id)
			imgs := []string{}
			for imgRows.Next() {
				var url string
				if err := imgRows.Scan(&url); err == nil {
					imgs = append(imgs, url)
				}
			}
			imgRows.Close()
			// 型号
			modelRows, _ := pool.Query(context.Background(), "SELECT id, model_name, price, stock FROM product_models WHERE product_id=$1", id)
			models := []gin.H{}
			for modelRows.Next() {
				var mid int
				var mname string
				var price float64
				var stock int
				if err := modelRows.Scan(&mid, &mname, &price, &stock); err == nil {
					models = append(models, gin.H{"id": mid, "name": mname, "price": price, "stock": stock})
				}
			}
			modelRows.Close()
			// 评价
			reviewRows, _ := pool.Query(context.Background(), "SELECT username, rating, content, created_at, model_id FROM product_reviews WHERE product_id=$1 ORDER BY created_at DESC LIMIT 10", id)
			reviews := []gin.H{}
			for reviewRows.Next() {
				var username, content string
				var rating, modelId int
				var createdAt interface{}
				if err := reviewRows.Scan(&username, &rating, &content, &createdAt, &modelId); err == nil {
					reviews = append(reviews, gin.H{"username": username, "rating": rating, "content": content, "created_at": createdAt, "model_id": modelId})
				}
			}
			reviewRows.Close()
			c.JSON(200, gin.H{
				"id": id, "title": title, "category": category, "description": description,
				"imgs": imgs, "models": models, "reviews": reviews,
			})
		})

		// 商品评论列表接口
		api.GET("/products/:id/reviews", func(c *gin.Context) {
			idStr := c.Param("id")
			var id int
			if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
				c.JSON(400, gin.H{"error": "参数错误"})
				return
			}
			rows, err := pool.Query(context.Background(), "SELECT username, rating, content, created_at, model_id FROM product_reviews WHERE product_id=$1 ORDER BY created_at DESC", id)
			if err != nil {
				c.JSON(500, gin.H{"error": "数据库错误"})
				return
			}
			defer rows.Close()
			reviews := []gin.H{}
			for rows.Next() {
				var username, content string
				var rating, modelId int
				var createdAt interface{}
				if err := rows.Scan(&username, &rating, &content, &createdAt, &modelId); err == nil {
					reviews = append(reviews, gin.H{"username": username, "rating": rating, "content": content, "created_at": createdAt, "model_id": modelId})
				}
			}
			c.JSON(200, gin.H{"reviews": reviews})
		})

		// 购物车列表接口
		api.GET("/cart", func(c *gin.Context) {
			session := sessions.Default(c)
			username, ok := session.Get("user").(string)
			if !ok || username == "" {
				c.JSON(401, gin.H{"error": "未登录"})
				return
			}

			var userID int
			err := pool.QueryRow(context.Background(),
				"SELECT id FROM users WHERE username=$1", username).Scan(&userID)
			if err != nil {
				fmt.Println("用户不存在：", err)
				c.JSON(500, gin.H{"error": "用户不存在"})
				return
			}

			query := `
			SELECT c.id, c.product_id, c.model_id, c.quantity,
			       p.title, p.category,
			       m.model_name, m.price,
			       COALESCE(img.url, '') AS img_url
			FROM cart c
			JOIN products p ON c.product_id = p.id
			JOIN product_models m ON c.model_id = m.id
			LEFT JOIN LATERAL (
				SELECT url FROM product_images
				WHERE product_id = p.id
				ORDER BY id LIMIT 1
			) img ON TRUE
			WHERE c.user_id = $1
			ORDER BY c.id DESC
		`

			rows, err := pool.Query(context.Background(), query, userID)
			if err != nil {
				fmt.Println("查询购物车失败：", err)
				c.JSON(500, gin.H{"error": "数据库错误"})
				return
			}
			defer rows.Close()

			items := []gin.H{}

			for rows.Next() {
				var (
					id, productID, modelID, qty        int
					title, category, modelName, imgURL string
					price                              float64
				)

				err := rows.Scan(&id, &productID, &modelID, &qty, &title, &category, &modelName, &price, &imgURL)
				if err != nil {
					fmt.Println("行解析错误：", err)
					continue
				}

				items = append(items, gin.H{
					"id":         id,
					"product_id": productID,
					"model_id":   modelID,
					"name":       title,
					"shop":       "官方旗舰店",
					"img":        imgURL,
					"model":      modelName,
					"price":      price,
					"qty":        qty,
				})
			}

			c.JSON(200, items)
		})

		// 购物车添加接口
		api.POST("/cart", func(c *gin.Context) {
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
			type AddCartReq struct {
				ProductID int `json:"product_id"`
				ModelID   int `json:"model_id"`
				Qty       int `json:"qty"`
			}
			var req AddCartReq
			if err := c.ShouldBindJSON(&req); err != nil || req.ProductID == 0 || req.ModelID == 0 || req.Qty < 1 {
				c.JSON(400, gin.H{"error": "参数错误"})
				return
			}
			// 查找是否已存在该商品型号
			var existID int
			err = pool.QueryRow(context.Background(), "SELECT id FROM cart WHERE user_id=$1 AND product_id=$2 AND model_id=$3", userID, req.ProductID, req.ModelID).Scan(&existID)
			if err == nil {
				// 已存在则更新数量
				_, err = pool.Exec(context.Background(), "UPDATE cart SET quantity = quantity + $1, updated_at=now() WHERE id=$2", req.Qty, existID)
				if err != nil {
					c.JSON(500, gin.H{"error": "更新失败"})
					return
				}
				c.JSON(200, gin.H{"message": "已更新数量"})
				return
			}
			// 不存在则插入
			_, err = pool.Exec(context.Background(), "INSERT INTO cart (user_id, product_id, model_id, quantity) VALUES ($1, $2, $3, $4)", userID, req.ProductID, req.ModelID, req.Qty)
			if err != nil {
				c.JSON(500, gin.H{"error": "添加失败"})
				return
			}
			c.JSON(200, gin.H{"message": "添加成功"})
		})

		// 购物车数量修改接口
		api.PUT("/cart", func(c *gin.Context) {
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
			type UpdateCartReq struct {
				CartID int `json:"id"`
				Qty    int `json:"qty"`
			}
			var req UpdateCartReq
			if err := c.ShouldBindJSON(&req); err != nil || req.CartID == 0 || req.Qty < 1 {
				c.JSON(400, gin.H{"error": "参数错误"})
				return
			}
			// 校验该购物车项归属
			var existID int
			err = pool.QueryRow(context.Background(), "SELECT id FROM cart WHERE id=$1 AND user_id=$2", req.CartID, userID).Scan(&existID)
			if err != nil {
				c.JSON(404, gin.H{"error": "购物车项不存在"})
				return
			}
			_, err = pool.Exec(context.Background(), "UPDATE cart SET quantity=$1, updated_at=now() WHERE id=$2", req.Qty, req.CartID)
			if err != nil {
				c.JSON(500, gin.H{"error": "更新失败"})
				return
			}
			c.JSON(200, gin.H{"message": "数量已更新"})
		})

		// 购物车移除接口
		api.DELETE("/cart", func(c *gin.Context) {
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
			type DelCartReq struct {
				CartID int `json:"id"`
			}
			var req DelCartReq
			if err := c.ShouldBindJSON(&req); err != nil || req.CartID == 0 {
				c.JSON(400, gin.H{"error": "参数错误"})
				return
			}
			_, err = pool.Exec(context.Background(), "DELETE FROM cart WHERE id=$1 AND user_id=$2", req.CartID, userID)
			if err != nil {
				c.JSON(500, gin.H{"error": "删除失败"})
				return
			}
			c.JSON(200, gin.H{"message": "已移除"})
		})

		// 注册订单相关接口
		RegisterOrderCountsRoute(r, pool)
		RegisterOrderListRoute(r, pool)
		RegisterOrderCreateRoute(r, pool)
		RegisterOrderDetailRoute(r, pool)

		api.POST("/order/pay", func(c *gin.Context) {
			type PayRequest struct {
				OrderID int `json:"order_id"`
			}
			var req PayRequest
			if err := c.ShouldBindJSON(&req); err != nil || req.OrderID == 0 {
				c.JSON(400, gin.H{"error": "参数错误"})
				return
			}
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
			// 校验订单归属和状态
			var status string
			err = pool.QueryRow(context.Background(), "SELECT status FROM orders WHERE id=$1 AND user_id=$2", req.OrderID, userID).Scan(&status)
			if err != nil {
				c.JSON(404, gin.H{"error": "订单不存在"})
				return
			}
			if status != "pending" {
				c.JSON(400, gin.H{"error": "订单状态不可支付"})
				return
			}
			// 更新订单状态为已付款（如 toship）
			_, err = pool.Exec(context.Background(), "UPDATE orders SET status='toship', updated_at=NOW() WHERE id=$1", req.OrderID)
			if err != nil {
				c.JSON(500, gin.H{"error": "支付失败"})
				return
			}
			c.JSON(200, gin.H{"message": "支付成功"})
		})
	}
}
