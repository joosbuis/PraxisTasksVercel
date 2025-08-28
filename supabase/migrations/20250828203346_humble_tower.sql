/*
  # Fix test account for first-time login

  1. Updates
    - Set `is_first_login` to true for employee 1001
    - Set `temporary_code` to 'manager123' for employee 1001
    - Ensure the account is properly configured for the first-time login flow

  2. Security
    - The temporary code will be used once and then replaced with a proper password
    - User will be prompted to set a new password on first login
*/

-- Update the test account to enable first-time login flow
UPDATE users 
SET 
  is_first_login = true,
  temporary_code = 'manager123',
  temporary_code_used_at = NULL,
  updated_at = now()
WHERE employee_number = '1001';

-- Verify the update was successful
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE employee_number = '1001' 
    AND is_first_login = true 
    AND temporary_code = 'manager123'
  ) THEN
    RAISE EXCEPTION 'Failed to update test account for first-time login';
  END IF;
END $$;