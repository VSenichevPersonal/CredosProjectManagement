-- Drop all existing RLS policies
DROP POLICY IF EXISTS "Super admins can view audit log" ON audit_log;
DROP POLICY IF EXISTS "Users can view their organization compliance" ON compliance_records;
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can view organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON regulatory_documents;
DROP POLICY IF EXISTS "Authenticated users can view requirements" ON requirements;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can view themselves" ON users;

-- Disable RLS on all tables
ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE requirements DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;

-- Return status
SELECT 'All RLS policies deleted and RLS disabled on all tables' as status;
