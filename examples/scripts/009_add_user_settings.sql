-- Add user settings fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS position VARCHAR(100),
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "emailNewRequirement": true,
  "emailDeadlineReminder": true,
  "emailStatusChange": true,
  "emailComments": false,
  "inAppNewRequirement": true,
  "inAppDeadlineReminder": true,
  "inAppStatusChange": true,
  "inAppComments": true
}'::jsonb;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_position ON users(position);
