# 📦 TAXI APP - РУКОВОДСТВО ПО РАЗВЕРТЫВАНИЮ

## 🚀 БЫСТРЫЙ СТАРТ

### Шаг 1: Установка зависимостей
```bash
npm install
```

### Шаг 2: Конфигурация
Создайте файл `.env` в корне проекта:
```env
# API Configuration
REACT_APP_API_URL=https://your-api-server.com
REACT_APP_SERVER_BASE_URL=https://your-backend.com

# Map Services
REACT_APP_ORS_TOKEN=your_openrouteservice_token
REACT_APP_HERE_API_KEY=your_here_maps_key

# Optional: Custom Settings
REACT_APP_DEFAULT_LANGUAGE=ru
REACT_APP_DEFAULT_COUNTRY=RUS
```

### Шаг 3: Сборка
```bash
npm run build
```

### Шаг 4: Развертывание
Содержимое папки `build/` загрузите на ваш веб-сервер.

## 🌐 НАСТРОЙКА ВЕБ-СЕРВЕРА

### Nginx
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/taxi-app/build;

    location / {
        try_files $uri /index.html;
    }

    # API Proxy (если backend на том же сервере)
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Apache
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /var/www/taxi-app/build

    <Directory /var/www/taxi-app/build>
        Options -MultiViews
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteRule ^ index.html [QSA,L]
    </Directory>
</VirtualHost>
```

## 🔧 ПОДКЛЮЧЕНИЕ BACKEND

### Вариант 1: Используйте готовый backend из папки `taxi-master-backend`
```bash
cd taxi-master-backend
npm install
npm run build
npm start
```

### Вариант 2: Подключите свой backend
Убедитесь, что ваш API поддерживает следующие endpoints:
- `POST /api/auth/login` - авторизация
- `POST /api/auth/register` - регистрация
- `POST /api/orders/create` - создание заказа
- `GET /api/orders/active` - активные заказы
- `GET /api/drivers/nearby` - ближайшие водители

## 🗺️ НАСТРОЙКА КАРТ

### Получение API ключей:

1. **OpenRouteService** (для маршрутов):
   - Регистрация: https://openrouteservice.org/
   - Получите API ключ в личном кабинете

2. **HERE Maps** (для поиска адресов):
   - Регистрация: https://developer.here.com/
   - Создайте проект и получите API ключ

## 📱 МОБИЛЬНАЯ ВЕРСИЯ

Приложение полностью адаптивно и работает на мобильных устройствах.

Для интеграции с React Native:
- Используйте WebView
- Приложение автоматически определит React Native окружение

## 🔒 БЕЗОПАСНОСТЬ

1. **ОБЯЗАТЕЛЬНО** используйте HTTPS в продакшене
2. Настройте CORS на вашем backend
3. Используйте переменные окружения для всех ключей
4. Регулярно обновляйте зависимости

## 🐛 РЕШЕНИЕ ПРОБЛЕМ

### Белый экран после развертывания
- Проверьте консоль браузера на ошибки
- Убедитесь, что файл `data.js` доступен
- Проверьте настройки CORS

### Кнопки ORDER/VOTE не работают
- Проверьте подключение к API в `.env`
- Убедитесь, что backend запущен
- Проверьте сетевые запросы в DevTools

### Карта не загружается
- Проверьте API ключи для карт
- Убедитесь в наличии интернет-соединения

## 📞 ПОДДЕРЖКА

При возникновении проблем:
1. Проверьте файл `CRITICAL_CODE_AUDIT.md` для известных проблем
2. Просмотрите логи сервера
3. Проверьте консоль браузера

## ✅ ЧЕКЛИСТ ПЕРЕД ЗАПУСКОМ

- [ ] Настроен файл `.env` с вашими данными
- [ ] Backend API доступен и работает
- [ ] Получены и настроены API ключи для карт
- [ ] Настроен HTTPS сертификат
- [ ] Проверена работа на мобильных устройствах
- [ ] Настроены права доступа к файлам на сервере
- [ ] Создана резервная копия

## 🎯 ГОТОВО!

После выполнения всех шагов ваше приложение такси готово к работе.
Откройте браузер и перейдите на ваш домен.

Удачного запуска! 🚀