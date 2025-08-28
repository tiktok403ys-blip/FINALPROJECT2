-- Check existing admin PIN related functions and tables (FIXED VERSION)
-- Run this to see what already exists without column ambiguity errors

-- Check if admin_pins table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'admin_pins';

-- Check existing functions related to admin PIN (FIXED)
SELECT 
    r.routine_name,
    r.routine_type,
    r.data_type as return_type,
    p.parameter_name,
    p.parameter_mode,
    p.parameter_default,
    p.data_type as param_type
FROM information_schema.routines r
LEFT JOIN information_schema.parameters p ON r.routine_name = p.specific_name
WHERE r.routine_name LIKE '%pin%' OR r.routine_name LIKE '%admin%'
ORDER BY r.routine_name, p.ordinal_position;

-- Check if there are any existing RPC functions
SELECT 
    proname as function_name,
    proargnames as parameter_names,
    proargtypes as parameter_types
FROM pg_proc 
WHERE proname LIKE '%pin%' OR proname LIKE '%admin%';

-- Check existing tables with 'pin' in name
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name LIKE '%pin%';

-- Check if our new functions were created successfully
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN ('set_admin_pin', 'verify_admin_pin', 'update_admin_pins_updated_at');

-- Check if admin_pins table structure is correct
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'admin_pins'
ORDER BY ordinal_position;
