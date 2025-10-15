#!/bin/bash

# Тестовый скрипт для проверки API очистки БД
# ⚠️ ОПАСНО! Удаляет все данные!
# Запускайте когда сервер запущен (npm run dev)

echo "⚠️  ОПАСНО: Тестирование API полной очистки базы данных"
echo "=========================================================="
echo ""
echo "Это действие УДАЛИТ ВСЕ ДАННЫЕ из базы!"
echo ""
read -p "Вы уверены? Введите 'yes' для продолжения: " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Отменено пользователем"
  exit 0
fi

# URL локального API
API_URL="http://localhost:3000/api/admin/reset-db"

echo ""
echo "📡 Отправляем POST запрос на $API_URL"
echo ""

# Выполняем запрос (нужна авторизация!)
response=$(curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat .test-cookie 2>/dev/null || echo '')" \
  -d '{"confirm":"УДАЛИТЬ ВСЕ ДАННЫЕ"}' \
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
  echo "✅ База данных очищена"
  echo ""
  echo "💡 Теперь можете запустить seed для заполнения тестовыми данными:"
  echo "   ./scripts/test-seed-api.sh"
elif [ "$http_code" = "403" ]; then
  echo "⚠️  Требуется авторизация администратора"
elif [ "$http_code" = "400" ]; then
  echo "⚠️  Требуется подтверждение операции"
else
  echo "❌ Ошибка при очистке БД"
fi

