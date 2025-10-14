-- =====================================================
-- ДИАГНОСТИКА RLS ДЛЯ EVIDENCE
-- =====================================================
-- Дата: 13 октября 2025
-- Цель: Проверить все политики RLS для загрузки доказательств
-- 
-- Используйте этот скрипт в Supabase SQL Editor для диагностики

-- =====================================================
-- 1. ПРОВЕРКА ПОЛИТИК ДЛЯ ТАБЛИЦЫ evidence
-- =====================================================

SELECT 
  '=== ТАБЛИЦА evidence ===' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'evidence'
ORDER BY cmd, policyname;

-- =====================================================
-- 2. ПРОВЕРКА RLS ВКЛЮЧЕН ИЛИ НЕТ ДЛЯ evidence
-- =====================================================

SELECT 
  '=== RLS STATUS для evidence ===' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'evidence';

-- =====================================================
-- 3. ПРОВЕРКА ПОЛИТИК ДЛЯ evidence_links / control_measure_evidence
-- =====================================================

SELECT 
  '=== ТАБЛИЦА evidence_links ===' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'evidence_links'
ORDER BY cmd, policyname;

-- =====================================================
-- 4. ПРОВЕРКА ПОЛИТИК ДЛЯ control_measure_evidence
-- =====================================================

SELECT 
  '=== ТАБЛИЦА control_measure_evidence ===' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'control_measure_evidence'
ORDER BY cmd, policyname;

-- =====================================================
-- 5. ПРОВЕРКА RLS ДЛЯ СВЯЗАННЫХ ТАБЛИЦ
-- =====================================================

SELECT 
  '=== RLS STATUS для связанных таблиц ===' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('evidence_links', 'control_measure_evidence')
ORDER BY tablename;

-- =====================================================
-- 6. ПРОВЕРКА STORAGE BUCKET evidence-files
-- =====================================================

SELECT 
  '=== STORAGE BUCKET evidence-files ===' as info,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'evidence-files';

-- =====================================================
-- 7. ПРОВЕРКА STORAGE RLS ПОЛИТИК
-- =====================================================

SELECT 
  '=== STORAGE RLS POLICIES ===' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (
    policyname LIKE '%evidence%' 
    OR policyname LIKE '%authenticated%'
  )
ORDER BY cmd, policyname;

-- =====================================================
-- 8. СТРУКТУРА ТАБЛИЦЫ evidence (колонки)
-- =====================================================

SELECT 
  '=== СТРУКТУРА evidence ===' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'evidence'
ORDER BY ordinal_position;

-- =====================================================
-- 9. FOREIGN KEYS для evidence
-- =====================================================

SELECT 
  '=== FOREIGN KEYS evidence ===' as info,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='evidence';

-- =====================================================
-- 10. ПРОВЕРКА СУЩЕСТВОВАНИЯ ТАБЛИЦ
-- =====================================================

SELECT 
  '=== СУЩЕСТВУЮЩИЕ ТАБЛИЦЫ ===' as info,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND (
    tablename LIKE '%evidence%'
    OR tablename LIKE '%control_measure%'
  )
ORDER BY tablename;

-- =====================================================
-- 11. ПОСЛЕДНЯЯ МИГРАЦИЯ
-- =====================================================

SELECT 
  '=== ПОСЛЕДНЯЯ МИГРАЦИЯ ===' as info,
  version,
  name,
  applied_at
FROM supabase_migrations.schema_migrations
ORDER BY applied_at DESC
LIMIT 10;

-- =====================================================
-- 12. ТЕСТ: ПОПРОБОВАТЬ ВСТАВИТЬ ЗАПИСЬ
-- =====================================================

-- ВАЖНО: Этот запрос нужно выполнить от имени authenticated пользователя
-- Замените значения на реальные для вашего тестового пользователя

-- Проверяем, кто мы
SELECT 
  '=== ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ ===' as info,
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- Проверяем tenant_id текущего пользователя
SELECT 
  '=== TENANT_ID ПОЛЬЗОВАТЕЛЯ ===' as info,
  id as user_id,
  email,
  tenant_id,
  organization_id,
  role
FROM users
WHERE id = auth.uid();

-- =====================================================
-- КОНЕЦ ДИАГНОСТИКИ
-- =====================================================

SELECT '=== ДИАГНОСТИКА ЗАВЕРШЕНА ===' as info;

