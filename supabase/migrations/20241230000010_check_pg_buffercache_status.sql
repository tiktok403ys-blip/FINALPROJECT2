-- Migration: Check pg_buffercache Extension Status and Dependencies
-- Purpose: Analyze current status of pg_buffercache extension before moving it from public schema

-- Check if pg_buffercache extension exists and its current schema
DO $$
DECLARE
    ext_schema TEXT;
    ext_version TEXT;
    dependency_count INTEGER;
BEGIN
    -- Check extension existence and schema
    SELECT n.nspname, e.extversion
    INTO ext_schema, ext_version
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'pg_buffercache';
    
    IF ext_schema IS NOT NULL THEN
        RAISE NOTICE 'Extension pg_buffercache found:';
        RAISE NOTICE '  Schema: %', ext_schema;
        RAISE NOTICE '  Version: %', ext_version;
        
        -- Check if it's in public schema (security issue)
        IF ext_schema = 'public' THEN
            RAISE WARNING 'SECURITY ISSUE: pg_buffercache is installed in public schema!';
            RAISE NOTICE 'This extension should be moved to a dedicated schema for security.';
        ELSE
            RAISE NOTICE 'Extension is properly located outside public schema.';
        END IF;
    ELSE
        RAISE NOTICE 'Extension pg_buffercache is NOT installed.';
        RAISE NOTICE 'No action needed - extension does not exist.';
        RETURN;
    END IF;
    
    -- Check for objects that depend on pg_buffercache
    RAISE NOTICE '';
    RAISE NOTICE 'Checking for dependencies on pg_buffercache...';
    
    -- Check functions that reference pg_buffercache
    SELECT COUNT(*)
    INTO dependency_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.prosrc ILIKE '%pg_buffercache%'
       OR p.prosrc ILIKE '%pg_buffercache_%';
    
    IF dependency_count > 0 THEN
        RAISE NOTICE 'Found % functions that may reference pg_buffercache:', dependency_count;
        
        -- List the functions
        FOR ext_schema IN
            SELECT n.nspname || '.' || p.proname AS function_name
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE p.prosrc ILIKE '%pg_buffercache%'
               OR p.prosrc ILIKE '%pg_buffercache_%'
            LIMIT 10
        LOOP
            RAISE NOTICE '  - %', ext_schema;
        END LOOP;
    ELSE
        RAISE NOTICE 'No functions found that reference pg_buffercache.';
    END IF;
    
    -- Check views that might reference pg_buffercache
    SELECT COUNT(*)
    INTO dependency_count
    FROM pg_views
    WHERE definition ILIKE '%pg_buffercache%';
    
    IF dependency_count > 0 THEN
        RAISE NOTICE 'Found % views that reference pg_buffercache:', dependency_count;
        
        -- List the views
        FOR ext_schema IN
            SELECT schemaname || '.' || viewname AS view_name
            FROM pg_views
            WHERE definition ILIKE '%pg_buffercache%'
            LIMIT 10
        LOOP
            RAISE NOTICE '  - %', ext_schema;
        END LOOP;
    ELSE
        RAISE NOTICE 'No views found that reference pg_buffercache.';
    END IF;
    
    -- Check if extensions schema exists
    SELECT COUNT(*)
    INTO dependency_count
    FROM pg_namespace
    WHERE nspname = 'extensions';
    
    IF dependency_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE 'Schema "extensions" already exists - ready for migration.';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE 'Schema "extensions" does not exist - will need to be created.';
    END IF;
    
    -- Summary and recommendations
    RAISE NOTICE '';
    RAISE NOTICE '=== SUMMARY AND RECOMMENDATIONS ===';
    
    SELECT n.nspname
    INTO ext_schema
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'pg_buffercache';
    
    IF ext_schema = 'public' THEN
        RAISE NOTICE 'ACTION REQUIRED: Move pg_buffercache from public to extensions schema';
        RAISE NOTICE 'Steps needed:';
        RAISE NOTICE '1. Create extensions schema if not exists';
        RAISE NOTICE '2. Drop and recreate extension in extensions schema';
        RAISE NOTICE '3. Update any dependent objects to reference extensions.pg_buffercache';
        RAISE NOTICE '4. Set proper permissions on extensions schema';
        RAISE NOTICE '5. Test functionality';
    ELSE
        RAISE NOTICE 'Extension is already in a safe schema: %', ext_schema;
    END IF;
    
END $$;

-- Additional security check: List all extensions in public schema
DO $$
DECLARE
    ext_name TEXT;
    ext_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== ALL EXTENSIONS IN PUBLIC SCHEMA ===';
    
    FOR ext_name IN
        SELECT e.extname
        FROM pg_extension e
        JOIN pg_namespace n ON e.extnamespace = n.oid
        WHERE n.nspname = 'public'
        ORDER BY e.extname
    LOOP
        ext_count := ext_count + 1;
        RAISE NOTICE 'Extension in public: %', ext_name;
    END LOOP;
    
    IF ext_count = 0 THEN
        RAISE NOTICE 'No extensions found in public schema - good security posture!';
    ELSE
        RAISE WARNING 'Found % extensions in public schema - consider moving them!', ext_count;
    END IF;
END $$;