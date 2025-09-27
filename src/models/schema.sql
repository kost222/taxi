-- Таблица планов подписок
CREATE TABLE IF NOT EXISTS subscription_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  duration INTEGER NOT NULL, -- в днях
  features TEXT, -- JSON массив функций
  max_rides INTEGER, -- максимум поездок в месяц (NULL = безлимит)
  cashback_percent DECIMAL(5, 2) DEFAULT 0,
  popular BOOLEAN DEFAULT 0,
  discount_percent INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица подписок пользователей
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  payment_id VARCHAR(255),
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  status VARCHAR(50) NOT NULL, -- active, cancelled, expired
  auto_renew BOOLEAN DEFAULT 1,
  rides_used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);

-- Таблица типов грузов
CREATE TABLE IF NOT EXISTS cargo_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category VARCHAR(50) NOT NULL, -- documents, packages, fragile, heavy, special
  name VARCHAR(100) NOT NULL,
  max_weight DECIMAL(10, 2) NOT NULL, -- в кг
  max_length INTEGER, -- в см
  max_width INTEGER,
  max_height INTEGER,
  icon VARCHAR(50),
  price_multiplier DECIMAL(5, 2) DEFAULT 1.0,
  description TEXT,
  special_requirements TEXT,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица грузов в заказах
CREATE TABLE IF NOT EXISTS order_cargo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  cargo_type_id INTEGER NOT NULL,
  weight DECIMAL(10, 2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  length INTEGER, -- фактические размеры
  width INTEGER,
  height INTEGER,
  special_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (cargo_type_id) REFERENCES cargo_types(id)
);

-- Таблица аукционов заказов
CREATE TABLE IF NOT EXISTS order_auctions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  initial_price DECIMAL(10, 2) NOT NULL,
  current_price DECIMAL(10, 2) NOT NULL,
  final_price DECIMAL(10, 2),
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  status VARCHAR(50) NOT NULL, -- active, closed, closed_no_bids, cancelled
  winner_id INTEGER,
  bid_count INTEGER DEFAULT 0,
  last_bidder_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (winner_id) REFERENCES drivers(id),
  FOREIGN KEY (last_bidder_id) REFERENCES drivers(id)
);

-- Таблица ставок в аукционах
CREATE TABLE IF NOT EXISTS auction_bids (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  auction_id INTEGER NOT NULL,
  driver_id INTEGER NOT NULL,
  bid_amount DECIMAL(10, 2) NOT NULL,
  bid_time DATETIME NOT NULL,
  is_winning BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (auction_id) REFERENCES order_auctions(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

-- Таблица отзывов
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  driver_id INTEGER NOT NULL,
  rating_overall INTEGER NOT NULL CHECK (rating_overall >= 1 AND rating_overall <= 5),
  rating_driver INTEGER CHECK (rating_driver >= 1 AND rating_driver <= 5),
  rating_car INTEGER CHECK (rating_car >= 1 AND rating_car <= 5),
  rating_route INTEGER CHECK (rating_route >= 1 AND rating_route <= 5),
  comment TEXT,
  is_anonymous BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

-- Таблица чаевых "На подачу"
CREATE TABLE IF NOT EXISTS delivery_tips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  paid BOOLEAN DEFAULT 0,
  payment_id VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Таблица темы оформления пользователей
CREATE TABLE IF NOT EXISTS user_themes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  theme_id VARCHAR(50) NOT NULL,
  custom_colors TEXT, -- JSON с кастомными цветами
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Таблица WhatsApp кодов
CREATE TABLE IF NOT EXISTS whatsapp_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  used BOOLEAN DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица реферальных кодов
CREATE TABLE IF NOT EXISTS referral_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  code VARCHAR(10) NOT NULL UNIQUE,
  qr_data TEXT,
  uses_count INTEGER DEFAULT 0,
  max_uses INTEGER,
  bonus_amount DECIMAL(10, 2) DEFAULT 50.00,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Индексы для оптимизации
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_order_cargo_order_id ON order_cargo(order_id);
CREATE INDEX idx_order_auctions_order_id ON order_auctions(order_id);
CREATE INDEX idx_order_auctions_status ON order_auctions(status);
CREATE INDEX idx_auction_bids_auction_id ON auction_bids(auction_id);
CREATE INDEX idx_auction_bids_driver_id ON auction_bids(driver_id);
CREATE INDEX idx_reviews_order_id ON reviews(order_id);
CREATE INDEX idx_reviews_driver_id ON reviews(driver_id);
CREATE INDEX idx_delivery_tips_order_id ON delivery_tips(order_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);

-- Вставка начальных данных для планов подписок
INSERT OR IGNORE INTO subscription_plans (name, price, duration, features, max_rides, cashback_percent, popular) VALUES
('Базовый', 299, 30, '["10 поездок в месяц", "Стандартные классы", "Базовая поддержка"]', 10, 0, 0),
('Премиум', 799, 30, '["Безлимит поездок", "Все классы", "Поддержка 24/7", "Кэшбэк 5%"]', NULL, 5, 1),
('Бизнес', 2499, 30, '["Корпоративный аккаунт", "До 50 сотрудников", "Кэшбэк 10%"]', NULL, 10, 0),
('Годовой', 7999, 365, '["Все преимущества Премиум", "Экономия 20%"]', NULL, 5, 0);

-- Вставка начальных данных для типов грузов
INSERT OR IGNORE INTO cargo_types (category, name, max_weight, max_length, max_width, max_height, icon, price_multiplier) VALUES
('documents', 'Документы', 1, 30, 25, 5, '📄', 0.8),
('packages', 'Малый груз', 5, 40, 30, 30, '📦', 1.0),
('packages', 'Средний груз', 20, 60, 50, 40, '📦', 1.3),
('packages', 'Крупный груз', 50, 100, 80, 60, '📦', 1.7),
('heavy', 'Мебель', 100, 200, 150, 100, '🛋️', 2.5),
('fragile', 'Хрупкий груз', 30, 80, 60, 50, '⚠️', 2.0),
('special', 'Животные', 30, 80, 60, 60, '🐕', 2.0);