-- Check existing admin PIN related functions and tables
-- Run this first to see what already exists

-- Check if admin_pins table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'admin_pins';

-- Check existing functions related to admin PIN
SELECT 
    routine_name,
    routine_type,
    data_type,
    parameter_name,
    parameter_mode,
    parameter_default,
    data_type
FROM information_schema.routines r
LEFT JOIN information_schema.parameters p ON r.routine_name = p.specific_name
WHERE routine_name LIKE '%pin%' OR routine_name LIKE '%admin%'
ORDER BY routine_name, ordinal_position;

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
