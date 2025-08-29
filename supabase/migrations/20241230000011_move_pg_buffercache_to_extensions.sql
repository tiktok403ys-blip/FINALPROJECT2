-- Migration: Move pg_buffercache Extension from Public to Extensions Schema
-- Purpose: Improve security by moving pg_buffercache out of public schema
-- This addresses the security warning about extensions in public schema

-- Step 1: Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Step 2: Check if pg_buffercache exists in public schema and move it
DO $$
DECLARE
    ext_schema TEXT;
    has_dependencies BOOLEAN := FALSE;
    dep_count INTEGER;
BEGIN
    -- Check current schema of pg_buffercache
    SELECT n.nspname
    INTO ext_schema
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'pg_buffercache';
    
    IF ext_schema IS NULL THEN
        RAISE NOTICE 'Extension pg_buffercache not found - no action needed.';
        RETURN;
    END IF;
    
    IF ext_schema != 'public' THEN
        RAISE NOTICE 'Extension pg_buffercache is already in schema: %', ext_schema;
        RAISE NOTICE 'No migration needed.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found pg_buffercache in public schema - proceeding with migration...';
    
    -- Check for dependencies before dropping
    SELECT COUNT(*) > 0
    INTO has_dependencies
    FROM pg_depend d
    JOIN pg_extension e ON d.refobjid = e.oid
    WHERE e.extname = 'pg_buffercache'
      AND d.deptype = 'n';  -- normal dependency
    
    -- Check for functions that might reference pg_buffercache
    SELECT COUNT(*)
    INTO dep_count
    FROM pg_proc p
    WHERE p.prosrc ILIKE '%pg_buffercache%';
    
    IF dep_count > 0 THEN
        RAISE NOTICE 'Found % functions that may reference pg_buffercache', dep_count;
        RAISE NOTICE 'These will need to be updated after migration.';
    END IF;
    
    -- Attempt to drop and recreate the extension
    BEGIN
        RAISE NOTICE 'Attempting to drop pg_buffercache from public schema...';
        
        -- Try to drop the extension (this will fail if there are dependencies)
        DROP EXTENSION IF EXISTS pg_buffercache CASCADE;
        
        RAISE NOTICE 'Successfully dropped pg_buffercache from public schema.';
        
        -- Recreate in extensions schema
        RAISE NOTICE 'Creating pg_buffercache in extensions schema...';
        CREATE EXTENSION pg_buffercache SCHEMA extensions;
        
        RAISE NOTICE 'Successfully created pg_buffercache in extensions schema.';
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING 'Failed to move pg_buffercache: %', SQLERRM;
            RAISE NOTICE 'This may be due to existing dependencies.';
            RAISE NOTICE 'Manual intervention may be required.';
            
            -- Try to recreate in public if drop succeeded but create failed
            BEGIN
                CREATE EXTENSION IF NOT EXISTS pg_buffercache;
                RAISE NOTICE 'Restored pg_buffercache in public schema as fallback.';
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE WARNING 'Failed to restore pg_buffercache: %', SQLERRM;
            END;
            
            RETURN;
    END;
    
END $$;

-- Step 3: Set proper permissions on extensions schema
DO $$
BEGIN
    -- Revoke all permissions from public
    REVOKE ALL ON SCHEMA extensions FROM PUBLIC;
    
    -- Grant usage to authenticated users
    GRANT USAGE ON SCHEMA extensions TO authenticated;
    
    -- Grant usage to anon users (read-only access for monitoring)
    GRANT USAGE ON SCHEMA extensions TO anon;
    
    RAISE NOTICE 'Set proper permissions on extensions schema:';
    RAISE NOTICE '- Revoked all permissions from PUBLIC';
    RAISE NOTICE '- Granted USAGE to authenticated role';
    RAISE NOTICE '- Granted USAGE to anon role';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to set permissions on extensions schema: %', SQLERRM;
END $$;

-- Step 4: Verify the migration
DO $$
DECLARE
    ext_schema TEXT;
    ext_version TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== MIGRATION VERIFICATION ===';
    
    -- Check final location of pg_buffercache
    SELECT n.nspname, e.extversion
    INTO ext_schema, ext_version
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'pg_buffercache';
    
    IF ext_schema IS NOT NULL THEN
        RAISE NOTICE 'pg_buffercache extension status:';
        RAISE NOTICE '  Schema: %', ext_schema;
        RAISE NOTICE '  Version: %', ext_version;
        
        IF ext_schema = 'extensions' THEN
            RAISE NOTICE '✓ SUCCESS: pg_buffercache is now in extensions schema';
        ELSIF ext_schema = 'public' THEN
            RAISE WARNING '⚠ WARNING: pg_buffercache is still in public schema';
            RAISE NOTICE 'Manual migration may be required due to dependencies.';
        ELSE
            RAISE NOTICE '✓ INFO: pg_buffercache is in schema: %', ext_schema;
        END IF;
    ELSE
        RAISE WARNING '⚠ WARNING: pg_buffercache extension not found after migration';
    END IF;
    
    -- Check extensions schema permissions
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'extensions') THEN
        RAISE NOTICE '✓ Extensions schema exists and is ready for use';
    ELSE
        RAISE WARNING '⚠ Extensions schema was not created properly';
    END IF;
    
END $$;

-- Step 5: Provide guidance for any remaining issues
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== POST-MIGRATION NOTES ===';
    RAISE NOTICE 'If pg_buffercache is still in public schema:';
    RAISE NOTICE '1. Check for dependent objects that prevent migration';
    RAISE NOTICE '2. Update any functions/views to use extensions.pg_buffercache';
    RAISE NOTICE '3. Manually drop and recreate the extension';
    RAISE NOTICE '';
    RAISE NOTICE 'To verify pg_buffercache functionality:';
    RAISE NOTICE 'SELECT * FROM extensions.pg_buffercache LIMIT 1;';
    RAISE NOTICE '';
    RAISE NOTICE 'Migration completed. Check the logs above for any warnings.';
END $$;