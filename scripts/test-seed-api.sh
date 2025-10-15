#!/bin/bash

# Тестовый скрипт для проверки API засева БД
# Запускайте когда сервер запущен (npm run dev)

echo "🧪 Тестирование API засева базы данных"
echo "========================================="
echo ""

# URL локального API
API_URL="http://localhost:3000/api/admin/seed-db"

echo "📡 Отправляем POST запрос на $API_URL"
echo ""

# Выполняем запрос (нужна авторизация!)
response=$(curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat .test-cookie 2>/dev/null || echo '')" \
  -w "\n%{http_code}" \
  -s)

# Разделяем body и status code
http_body=$(echo "$response" | head -n -1)
http_code=$(echo "$response" | tail -n 1)

echo "📊 Статус код: $http_code"
echo ""
echo "📄 Ответ сервера:"
echo "$http_body" | jq '.' 2>/dev/null || echo "$http_body"
echo ""

if [ "$http_code" = "200" ]; then
  echo "✅ Seed выполнен успешно!"
elif [ "$http_code" = "403" ]; then
  echo "⚠️  Требуется авторизация администратора"
  echo "   Войдите в систему как admin и повторите запрос"
else
  echo "❌ Ошибка при выполнении seed"
fi

echo ""
echo "💡 Совет: Для авторизации откройте браузер, войдите как admin,"
echo "   откройте DevTools (F12), вкладка Network, скопируйте Cookie header"
echo "   и сохраните в файл .test-cookie"

