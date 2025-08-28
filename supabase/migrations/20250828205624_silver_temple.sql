/*
  # Add consume_temp_code function

  1. New Functions
    - `consume_temp_code(p_employee_number, p_code)` - Validates and consumes temporary login codes
      - Takes employee number and temporary code as parameters
      - Updates user record to mark first login as complete and clear temporary code
      - Returns the updated user record if successful

  2. Security
    - Function is accessible to authenticated users
    - Validates both employee number and temporary code match
*/

CREATE OR REPLACE FUNCTION public.consume_temp_code(p_employee_number text, p_code text)
RETURNS SETOF public.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _user public.users;
BEGIN
    UPDATE public.users
    SET
        is_first_login = FALSE,
        temporary_code = NULL,
        updated_at = NOW()
    WHERE
        employee_number = p_employee_number 
        AND temporary_code = p_code
        AND is_first_login = TRUE
    RETURNING * INTO _user;

    IF FOUND THEN
        RETURN NEXT _user;
    END IF;

    RETURN;
END;
$$;