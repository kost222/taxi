# Интеграция с ЮКасса

## Настройка

### Тестовый режим (текущий)
В файле `.env` уже настроены **тестовые ключи** ЮКасса:
- Shop ID: `381764678`
- Secret Key: `test_Fh8hUAVVBGUGbjmlzba6TB0iyUbos_lueTHE-axOwM0`

Эти ключи позволяют:
- ✅ Тестировать весь процесс оплаты
- ✅ Использовать тестовые карты ЮКасса
- ✅ Получать webhook уведомления
- ❌ НЕ проводить реальные платежи

### Тестовые карты
Для тестирования используйте:
- **Успешный платеж**: `5555 5555 5555 4444`
- **Отклоненный платеж**: `4111 1111 1111 1111`
- CVV: любые 3 цифры
- Срок: любая будущая дата

### Продакшен режим
Для реальных платежей:
1. Зарегистрируйтесь на [yookassa.ru](https://yookassa.ru)
2. Получите реальные ключи в личном кабинете
3. Замените в `.env`:
   ```env
   YOOKASSA_SHOP_ID=ваш_реальный_shop_id
   YOOKASSA_SECRET_KEY=live_ваш_реальный_секретный_ключ
   ```

## API Endpoints

### Создание платежа
```bash
POST /api/payments/create
Authorization: Bearer <jwt_token>

{
  "orderId": "order-uuid",
  "amount": 1500.00,
  "description": "Поездка по маршруту"
}
```

Ответ:
```json
{
  "success": true,
  "payment": {
    "paymentId": "2d931a82-000f-5000-8000-1e3a50b3c785",
    "confirmationUrl": "https://yookassa.ru/payments/...",
    "amount": "1500.00",
    "currency": "RUB",
    "status": "pending"
  }
}
```

### Webhook обработчик
ЮКасса отправляет уведомления на:
```
POST /api/payments/webhook
```

### Проверка статуса
```bash
GET /api/payments/status/{paymentId}
```

### Создание возврата
```bash
POST /api/payments/refund
Authorization: Bearer <jwt_token>

{
  "paymentId": "payment-uuid",
  "amount": 500.00
}
```

## Интеграция с фронтендом

В компоненте заказа после создания заказа:

```javascript
// 1. Создать платеж
const response = await fetch('/api/payments/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    orderId: order.b_id,
    amount: order.price
  })
});

const { payment } = await response.json();

// 2. Перенаправить на страницу оплаты
window.location.href = payment.confirmationUrl;
```

## Тестирование

1. Запустите backend:
   ```bash
   cd taxi-master-backend
   npm run dev
   ```

2. Создайте заказ через API

3. Создайте платеж для заказа

4. Перейдите по `confirmationUrl` для оплаты

5. Используйте тестовую карту `5555 5555 5555 4444`

6. После оплаты вас вернет на `http://localhost:5173/payment/success`

## Безопасность

⚠️ **Важно для продакшена:**
- Никогда не коммитьте реальные ключи в git
- Используйте переменные окружения
- Настройте HTTPS для webhook
- Проверяйте IP адреса webhook запросов
- Логируйте все платежные операции

## Поддержка

При проблемах проверьте:
1. Правильность ключей в `.env`
2. Доступность API ЮКасса
3. Логи в консоли backend
4. Статус платежа в личном кабинете ЮКасса