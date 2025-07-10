DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS cart CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS product_models CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;

DROP SEQUENCE IF EXISTS users_id_seq CASCADE;
DROP SEQUENCE IF EXISTS products_id_seq CASCADE;
DROP SEQUENCE IF EXISTS product_models_id_seq CASCADE;
DROP SEQUENCE IF EXISTS product_images_id_seq CASCADE;
DROP SEQUENCE IF EXISTS orders_id_seq CASCADE;
DROP SEQUENCE IF EXISTS cart_id_seq CASCADE;
DROP SEQUENCE IF EXISTS product_reviews_id_seq CASCADE;
DROP SEQUENCE IF EXISTS order_items_id_seq CASCADE;

CREATE SEQUENCE users_id_seq;
CREATE TABLE users (
  id int4 NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  username varchar(64) NOT NULL UNIQUE,
  password varchar(128) NOT NULL,
  address text,
  avatar text,
  nickname text,
  PRIMARY KEY (id)
);

CREATE SEQUENCE products_id_seq;
CREATE TABLE products (
  id int4 NOT NULL DEFAULT nextval('products_id_seq'::regclass),
  title varchar(255) NOT NULL,
  category varchar(100),
  description text,
  PRIMARY KEY (id)
);

CREATE SEQUENCE product_models_id_seq;
CREATE TABLE product_models (
  id int4 NOT NULL DEFAULT nextval('product_models_id_seq'::regclass),
  product_id int4 NOT NULL,
  model_name varchar(100) NOT NULL,
  price numeric(10,2) NOT NULL,
  stock int4 NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
);

CREATE SEQUENCE product_images_id_seq;
CREATE TABLE product_images (
  id int4 NOT NULL DEFAULT nextval('product_images_id_seq'::regclass),
  product_id int4 NOT NULL,
  url text NOT NULL,
  PRIMARY KEY (id)
);

CREATE SEQUENCE orders_id_seq;
CREATE TABLE orders (
  id int4 NOT NULL DEFAULT nextval('orders_id_seq'::regclass),
  user_id int4 NOT NULL,
  status varchar(20) NOT NULL CHECK (status IN (
    'pending', 'toship', 'toreceive', 'toreview', 'refund'
  )),
  total_price numeric(10,2) NOT NULL,
  address text,
  created_at timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE SEQUENCE order_items_id_seq;
CREATE TABLE order_items (
  id int4 NOT NULL DEFAULT nextval('order_items_id_seq'::regclass),
  order_id int4 NOT NULL,
  product_id int4 NOT NULL,
  model_id int4 NOT NULL,
  quantity int4 NOT NULL DEFAULT 1,
  price numeric(10,2) NOT NULL,
  PRIMARY KEY (id)
);

CREATE SEQUENCE cart_id_seq;
CREATE TABLE cart (
  id int4 NOT NULL DEFAULT nextval('cart_id_seq'::regclass),
  user_id int4 NOT NULL,
  product_id int4 NOT NULL,
  model_id int4 NOT NULL,
  quantity int4 NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE (user_id, product_id, model_id)
);

CREATE SEQUENCE product_reviews_id_seq;
CREATE TABLE product_reviews (
  id int4 NOT NULL DEFAULT nextval('product_reviews_id_seq'::regclass),
  product_id int4 NOT NULL,
  model_id int4 NOT NULL,
  username varchar(64) NOT NULL,
  rating int4 NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content text,
  created_at timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- 添加外键约束
ALTER TABLE product_models ADD CONSTRAINT fk_product_models_product_id FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE product_images ADD CONSTRAINT fk_product_images_product_id FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE orders ADD CONSTRAINT fk_orders_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE order_items ADD CONSTRAINT fk_order_items_order_id FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE order_items ADD CONSTRAINT fk_order_items_product_id FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE order_items ADD CONSTRAINT fk_order_items_model_id FOREIGN KEY (model_id) REFERENCES product_models(id) ON DELETE CASCADE;
ALTER TABLE cart ADD CONSTRAINT fk_cart_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE cart ADD CONSTRAINT fk_cart_product_id FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE cart ADD CONSTRAINT fk_cart_model_id FOREIGN KEY (model_id) REFERENCES product_models(id) ON DELETE CASCADE;
ALTER TABLE product_reviews ADD CONSTRAINT fk_product_reviews_product_id FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE product_reviews ADD CONSTRAINT fk_product_reviews_model_id FOREIGN KEY (model_id) REFERENCES product_models(id) ON DELETE CASCADE;

-- 插入测试数据
INSERT INTO users (username, password, nickname) VALUES ('admin', '123456', 'admin');

INSERT INTO products (title, category, description) VALUES 
('iPhone 15 Pro', '手机', '苹果最新旗舰手机，搭载A17 Pro芯片'),
('MacBook Pro', '电脑', '苹果专业级笔记本电脑'),
('AirPods Pro', '耳机', '苹果无线降噪耳机'),
('小米 14', '手机', '小米新一代旗舰，徕卡影像'),
('华为 Mate60 Pro', '手机', '华为自研芯片，超强续航'),
('ThinkPad X1 Carbon', '电脑', '商务轻薄本，经典耐用'),
('戴尔 XPS 13', '电脑', '高端超极本，窄边框设计'),
('索尼 WH-1000XM5', '耳机', '顶级降噪耳机，舒适佩戴'),
('三星 Galaxy S24', '手机', '三星旗舰，超感屏'),
('荣耀 Magic6', '手机', '荣耀高端旗舰，超长续航'),
('联想拯救者 Y9000P', '电脑', '高性能游戏本'),
('JBL TUNE 230NC', '耳机', 'JBL主动降噪耳机'),
('vivo X100 Pro', '手机', '蔡司影像，旗舰体验'),
('OPPO Find X7', '手机', '超光影潜望长焦'),
('华硕灵耀14', '电脑', '轻薄便携，OLED屏'),
('Beats Studio Buds', '耳机', 'Beats无线耳机，潮流之选');

INSERT INTO product_models (product_id, model_name, price, stock) VALUES 
(1, '128GB 深空黑色', 7999.00, 50),
(1, '256GB 深空黑色', 8999.00, 30),
(1, '512GB 深空黑色', 10999.00, 20),
(1, '1TB 深空黑色', 13999.00, 10),
(1, '256GB 原色钛金', 8999.00, 15),
(2, '13英寸 M3 8GB+256GB', 12999.00, 15),
(2, '13英寸 M3 16GB+512GB', 15999.00, 10),
(2, '14英寸 M3 8GB+512GB', 13999.00, 8),
(2, '16英寸 M3 32GB+1TB', 22999.00, 5),
(3, '第二代', 1899.00, 100),
(3, '第三代', 2199.00, 80),
(3, '典藏版', 2599.00, 30),
(4, '12GB+256GB 黑色', 4299.00, 80),
(4, '16GB+512GB 白色', 4999.00, 60),
(4, '12GB+512GB 蓝色', 4799.00, 40),
(4, '16GB+1TB 黑色', 5999.00, 20),
(5, '12GB+256GB 雅川青', 6499.00, 40),
(5, '16GB+512GB 白色', 7299.00, 30),
(5, '16GB+1TB 雅川青', 8299.00, 10),
(5, '12GB+1TB 白色', 7699.00, 12),
(6, 'i7 16GB+512GB', 9999.00, 20),
(6, 'i5 16GB+1TB', 8999.00, 15),
(6, 'i7 32GB+1TB', 11999.00, 6),
(7, 'i5 8GB+256GB', 8999.00, 8),
(7, 'i7 32GB+1TB', 13999.00, 4),
(8, '黑色', 2999.00, 50),
(8, '银色', 2999.00, 30),
(8, '限量金色', 3499.00, 10),
(9, '12GB+256GB', 6999.00, 35),
(9, '16GB+512GB', 7999.00, 18),
(10, '12GB+256GB', 4999.00, 40),
(10, '16GB+512GB', 5999.00, 20),
(11, 'i9 32GB+1TB', 13999.00, 8),
(11, 'i7 16GB+512GB', 11999.00, 6),
(12, '黑色', 599.00, 100),
(12, '白色', 599.00, 60),
(13, '16GB+512GB', 5999.00, 25),
(13, '12GB+256GB', 5699.00, 18),
(14, '16GB+512GB', 6299.00, 22),
(14, '12GB+256GB', 5999.00, 15),
(15, 'i5 16GB+512GB', 7999.00, 12),
(15, 'i7 16GB+512GB', 8999.00, 8),
(16, '红色', 1299.00, 60),
(16, '黑金限量版', 1499.00, 20);

INSERT INTO product_images (product_id, url) VALUES 
(1, 'https://www.apple.com/newsroom/images/2023/09/apple-unveils-iphone-15-pro-and-iphone-15-pro-max/article/Apple-iPhone-15-Pro-lineup-color-lineup-geo-230912_big.jpg.large_2x.jpg'),
(2, 'https://pica.zhimg.com/v2-966822e085cc0268f64b44cf75b76f5d_r.jpg?source=172ae18b'),
(3, 'https://m-cdn.phonearena.com/images/reviews/245546-image/BK6A9875.jpg'),
(4, 'https://img0.pconline.com.cn/pconline/2311/14/16826998_13201655_thumb.jpg'),
(5, 'https://th.bing.com/th/id/R.aa720cf090dda606ddd51ce4e48e2ef5?rik=FhQppSdbtbDAuA&riu=http%3a%2f%2fs.laoyaoba.com%2fjwImg%2f954018882749.131597134597468.1414.jpg&ehk=OfZmjKxyYjx8Es7paYVVmeedX7bYfkI23iNoFsF%2f%2bBU%3d&risl=&pid=ImgRaw&r=0'),
(6, 'https://notebooks.com/wp-content/uploads/2012/12/X1_Carbon-Touch_hero_05.jpg'),
(7, 'https://th.bing.com/th/id/OIP.3ti9Do9uJiXUPkWPkrcFhwHaE6?r=0&o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3'),
(8, 'https://x0.ifengimg.com/res/2022/6525FD9C695AB0F1F9193F5738C9481FE79B4366_size76_w1280_h720.jpeg'),
(9, 'https://tse4.mm.bing.net/th/id/OIP.67P4CLNOPwSCPeCvKJ0_gQHaHd?r=0&rs=1&pid=ImgDetMain&o=7&rm=3'),
(10, 'https://img1.mydrivers.com/img/20240311/eac8dd2fbe024ab6b7acd80cf19b2884.jpg'),
(11, 'https://tse2.mm.bing.net/th/id/OIP.nzRGPlE3455oLC1rDcTppwHaEm?r=0&rs=1&pid=ImgDetMain&o=7&rm=3'),
(12, 'https://tse1.mm.bing.net/th/id/OIP.4HwtlHXBeEmpdncu1m8_2gAAAA?r=0&rs=1&pid=ImgDetMain&o=7&rm=3'),
(13, 'https://tse4.mm.bing.net/th/id/OIP.BWZT22VEUzuRgTDrbP1BHAHaE8?r=0&rs=1&pid=ImgDetMain&o=7&rm=3'),
(14, 'https://tse1.mm.bing.net/th/id/OIP.Df9fr0Yu79YRMQoxvXI_kgHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3'),
(15, 'https://tse2.mm.bing.net/th/id/OIP.Cry-OsoH5AKzIZA8dPfe1wHaE5?r=0&rs=1&pid=ImgDetMain&o=7&rm=3'),
(16, 'https://macstore.id/wp-content/uploads/2020/09/MJ4Y3.jpeg');



INSERT INTO product_reviews (product_id, model_id, username, rating, content) VALUES
(1, 1, 'alice', 5, '非常棒的手机，性能强大，外观漂亮！'),
(1, 2, 'bob', 4, '256G 性价比高，发货很快，满意'),
(2, 4, 'charlie', 5, 'MacBook Pro 轻薄高效，办公利器'),
(3, 6, 'david', 3, '耳机降噪一般，音质还可以'),
(1, 3, 'eva', 5, '512G 用着很爽，推荐！'),
(4, 7, 'alice', 5, '小米14手感很好，系统流畅，徕卡影像很棒！'),
(4, 8, 'bob', 4, '白色很漂亮，性价比高，值得入手'),
(5, 9, 'charlie', 5, '华为Mate60 Pro续航超强，信号好'),
(5, 10, 'david', 3, '外观大气，价格略高'),
(6, 11, 'eva', 5, 'ThinkPad键盘手感一流，办公神器'),
(7, 12, 'frank', 4, 'XPS 13屏幕素质高，做工精致'),
(8, 13, 'grace', 5, '索尼降噪耳机，安静享受音乐'),
(9, 14, 'henry', 4, '三星S24屏幕很棒，拍照清晰'),
(10, 15, 'irene', 5, '荣耀Magic6续航很强，系统流畅'),
(11, 16, 'jack', 5, '拯救者Y9000P性能怪兽，游戏无压力'),
(12, 17, 'kate', 4, 'JBL耳机音质不错，降噪一般'),
(13, 18, 'leo', 5, 'vivo蔡司影像，拍照很棒'),
(14, 19, 'mona', 4, 'OPPO Find X7长焦很强，外观时尚'),
(15, 20, 'nina', 5, '华硕灵耀14轻薄便携，屏幕好看'),
(16, 21, 'oliver', 4, 'Beats Studio Buds低音澎湃，佩戴舒适');
