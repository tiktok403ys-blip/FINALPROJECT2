-- Migration: Verify pg_buffercache Extension Migration
-- Purpose: Comprehensive verification that pg_buffercache has been successfully moved to extensions schema
-- and test its functionality

-- Step 1: Verify extension location and status
DO $$
DECLARE
    ext_schema TEXT;
    ext_version TEXT;
    migration_success BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '=== PG_BUFFERCACHE MIGRATION VERIFICATION ===';
    RAISE NOTICE '';
    
    -- Check current location of pg_buffercache
    SELECT n.nspname, e.extversion
    INTO ext_schema, ext_version
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'pg_buffercache';
    
    IF ext_schema IS NULL THEN
        RAISE WARNING '❌ CRITICAL: pg_buffercache extension not found!';
        RAISE NOTICE 'The extension may have been accidentally dropped during migration.';
        RAISE NOTICE 'Consider reinstalling: CREATE EXTENSION pg_buffercache SCHEMA extensions;';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Extension pg_buffercache found:';
    RAISE NOTICE '  Current Schema: %', ext_schema;
    RAISE NOTICE '  Version: %', ext_version;
    RAISE NOTICE '';
    
    -- Verify migration success
    IF ext_schema = 'extensions' THEN
        RAISE NOTICE '✅ SUCCESS: pg_buffercache successfully moved to extensions schema!';
        migration_success := TRUE;
    ELSIF ext_schema = 'public' THEN
        RAISE WARNING '⚠️  WARNING: pg_buffercache is still in public schema';
        RAISE NOTICE 'Security issue remains - manual intervention may be required.';
        RAISE NOTICE 'This could be due to existing dependencies preventing migration.';
    ELSE
        RAISE NOTICE '✅ INFO: pg_buffercache is in schema: %', ext_schema;
        RAISE NOTICE 'Extension is not in public schema, which is good for security.';
        migration_success := TRUE;
    END IF;
    
    -- Store result for later use
    IF migration_success THEN
        RAISE NOTICE '';
        RAISE NOTICE 'Migration verification: PASSED';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE 'Migration verification: NEEDS ATTENTION';
    END IF;
    
END $$;

-- Step 2: Verify extensions schema permissions
DO $$
DECLARE
    schema_exists BOOLEAN;
    perm_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== EXTENSIONS SCHEMA SECURITY VERIFICATION ===';
    
    -- Check if extensions schema exists
    SELECT EXISTS(
        SELECT 1 FROM pg_namespace WHERE nspname = 'extensions'
    ) INTO schema_exists;
    
    IF schema_exists THEN
        RAISE NOTICE '✅ Extensions schema exists';
        
        -- Check schema permissions
        RAISE NOTICE 'Schema permissions:';
        
        FOR perm_record IN
            SELECT 
                grantee,
                privilege_type,
                is_grantable
            FROM information_schema.usage_privileges 
            WHERE object_schema = 'extensions'
            AND object_type = 'SCHEMA'
            ORDER BY grantee, privilege_type
        LOOP
            RAISE NOTICE '  - %: % (grantable: %)', 
                perm_record.grantee, 
                perm_record.privilege_type, 
                perm_record.is_grantable;
        END LOOP;
        
    ELSE
        RAISE WARNING '❌ Extensions schema does not exist!';
        RAISE NOTICE 'This should have been created during migration.';
    END IF;
    
END $$;

-- Step 3: Test pg_buffercache functionality
DO $$
DECLARE
    test_result RECORD;
    row_count INTEGER;
    ext_schema TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== PG_BUFFERCACHE FUNCTIONALITY TEST ===';
    
    -- Get the current schema of pg_buffercache
    SELECT n.nspname
    INTO ext_schema
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'pg_buffercache';
    
    IF ext_schema IS NULL THEN
        RAISE WARNING 'Cannot test functionality - pg_buffercache extension not found';
        RETURN;
    END IF;
    
    BEGIN
        -- Test basic functionality
        IF ext_schema = 'extensions' THEN
            -- Test with extensions schema
            EXECUTE format('SELECT COUNT(*) FROM %I.pg_buffercache', ext_schema) INTO row_count;
            RAISE NOTICE '✅ SUCCESS: pg_buffercache is functional in extensions schema';
            RAISE NOTICE '  Buffer cache entries found: %', row_count;
            
            -- Test a sample query
            EXECUTE format('
                SELECT 
                    bufferid,
                    relfilenode,
                    reltablespace,
                    reldatabase,
                    relforknumber,
                    relblocknumber,
                    isdirty,
                    usagecount
                FROM %I.pg_buffercache 
                WHERE bufferid IS NOT NULL 
                LIMIT 1
            ', ext_schema) INTO test_result;
            
            IF test_result IS NOT NULL THEN
                RAISE NOTICE '✅ Sample query successful - extension is working properly';
            ELSE
                RAISE NOTICE 'ℹ️  No buffer cache data available (this is normal in some environments)';
            END IF;
            
        ELSE
            -- Test with current schema (fallback)
            EXECUTE format('SELECT COUNT(*) FROM %I.pg_buffercache', ext_schema) INTO row_count;
            RAISE NOTICE '✅ pg_buffercache is functional in % schema', ext_schema;
            RAISE NOTICE '  Buffer cache entries found: %', row_count;
        END IF;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING '❌ FUNCTIONALITY TEST FAILED: %', SQLERRM;
            RAISE NOTICE 'This indicates the extension may not be properly installed or accessible.';
    END;
    
END $$;

-- Step 4: Check for any remaining security issues
DO $$
DECLARE
    public_ext_count INTEGER;
    ext_name TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== SECURITY AUDIT: EXTENSIONS IN PUBLIC SCHEMA ===';
    
    -- Count extensions still in public schema
    SELECT COUNT(*)
    INTO public_ext_count
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE n.nspname = 'public';
    
    IF public_ext_count = 0 THEN
        RAISE NOTICE '✅ EXCELLENT: No extensions found in public schema!';
        RAISE NOTICE 'Database has optimal security posture regarding extensions.';
    ELSE
        RAISE WARNING '⚠️  Found % extensions still in public schema:', public_ext_count;
        
        -- List remaining extensions in public
        FOR ext_name IN
            SELECT e.extname
            FROM pg_extension e
            JOIN pg_namespace n ON e.extnamespace = n.oid
            WHERE n.nspname = 'public'
            ORDER BY e.extname
        LOOP
            RAISE NOTICE '  - %', ext_name;
        END LOOP;
        
        RAISE NOTICE 'Consider moving these extensions to dedicated schemas for better security.';
    END IF;
    
END $$;

-- Step 5: Final summary and recommendations
DO $$
DECLARE
    ext_schema TEXT;
    final_status TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== MIGRATION SUMMARY ===';
    
    -- Get final status
    SELECT n.nspname
    INTO ext_schema
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'pg_buffercache';
    
    IF ext_schema = 'extensions' THEN
        final_status := 'COMPLETED SUCCESSFULLY';
        RAISE NOTICE '🎉 MIGRATION STATUS: %', final_status;
        RAISE NOTICE '';
        RAISE NOTICE 'Benefits achieved:';
        RAISE NOTICE '✅ Improved security - pg_buffercache removed from public schema';
        RAISE NOTICE '✅ Reduced attack surface - extensions isolated in dedicated schema';
        RAISE NOTICE '✅ Better organization - extensions grouped logically';
        RAISE NOTICE '✅ Proper access control - schema permissions configured';
        
    ELSIF ext_schema = 'public' THEN
        final_status := 'INCOMPLETE - MANUAL INTERVENTION REQUIRED';
        RAISE WARNING '⚠️  MIGRATION STATUS: %', final_status;
        RAISE NOTICE '';
        RAISE NOTICE 'Next steps required:';
        RAISE NOTICE '1. Identify and update dependent objects';
        RAISE NOTICE '2. Manually drop and recreate extension in extensions schema';
        RAISE NOTICE '3. Test all functionality that uses pg_buffercache';
        
    ELSIF ext_schema IS NULL THEN
        final_status := 'EXTENSION MISSING - REINSTALLATION REQUIRED';
        RAISE WARNING '❌ MIGRATION STATUS: %', final_status;
        RAISE NOTICE '';
        RAISE NOTICE 'Recovery steps:';
        RAISE NOTICE '1. CREATE EXTENSION pg_buffercache SCHEMA extensions;';
        RAISE NOTICE '2. Verify functionality with test queries';
        
    ELSE
        final_status := 'COMPLETED - EXTENSION IN SAFE SCHEMA';
        RAISE NOTICE '✅ MIGRATION STATUS: %', final_status;
        RAISE NOTICE 'Extension is in schema: %', ext_schema;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Verification completed at: %', NOW();
    
END $$;