#!/bin/bash
# Railway Auth Tables Initialization Script
# Создаёт таблицы auth.user и auth.session если их нет

set -e

echo "🚀 Railway Auth Init Script"
echo "DATABASE_URL: ${DATABASE_URL:0:30}..."

# Запускаем Node.js скрипт
node scripts/check-auth-tables.js

echo "✅ Railway auth initialization complete!"

