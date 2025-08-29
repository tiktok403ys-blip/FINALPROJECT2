-- Migration: Test functionality of update_updated_at_column trigger
-- Purpose: Verify that the trigger still works correctly after security fix
-- Date: 2024-12-30
-- Test: Create temporary table, add trigger, test functionality

-- Test the trigger functionality
DO $$
DECLARE
    test_table_exists BOOLEAN := FALSE;
    trigger_exists BOOLEAN := FALSE;
    initial_time TIMESTAMP;
    updated_time TIMESTAMP;
BEGIN
    RAISE NOTICE '=== TESTING: update_updated_at_column TRIGGER FUNCTIONALITY ===';
    
    -- Check if test table already exists
    SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'test_updated_at_trigger'
    ) INTO test_table_exists;
    
    -- Drop test table if it exists
    IF test_table_exists THEN
        DROP TABLE IF EXISTS public.test_updated_at_trigger;
        RAISE NOTICE 'Cleaned up existing test table';
    END IF;
    
    -- Create test table
    CREATE TABLE public.test_updated_at_trigger (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
    );
    
    RAISE NOTICE 'Created test table: test_updated_at_trigger';
    
    -- Create trigger on test table
    CREATE TRIGGER update_test_updated_at
        BEFORE UPDATE ON public.test_updated_at_trigger
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    
    RAISE NOTICE 'Created trigger: update_test_updated_at';
    
    -- Insert test data
    INSERT INTO public.test_updated_at_trigger (name) VALUES ('Test Record');
    
    -- Get initial timestamp
    SELECT updated_at FROM public.test_updated_at_trigger WHERE name = 'Test Record' INTO initial_time;
    RAISE NOTICE 'Initial updated_at: %', initial_time;
    
    -- Wait a moment (simulate time passage)
    PERFORM pg_sleep(1);
    
    -- Update the record to trigger the function
    UPDATE public.test_updated_at_trigger 
    SET name = 'Updated Test Record' 
    WHERE name = 'Test Record';
    
    -- Get updated timestamp
    SELECT updated_at FROM public.test_updated_at_trigger WHERE name = 'Updated Test Record' INTO updated_time;
    RAISE NOTICE 'Updated updated_at: %', updated_time;
    
    -- Verify that updated_at was changed
    IF updated_time > initial_time THEN
        RAISE NOTICE 'SUCCESS: Trigger is working correctly - updated_at was updated';
        RAISE NOTICE 'Time difference: % seconds', EXTRACT(EPOCH FROM (updated_time - initial_time));
    ELSE
        RAISE NOTICE 'ERROR: Trigger is not working - updated_at was not updated';
    END IF;
    
    -- Clean up test table
    DROP TABLE public.test_updated_at_trigger;
    RAISE NOTICE 'Cleaned up test table';
    
    RAISE NOTICE '=== TRIGGER FUNCTIONALITY TEST COMPLETED ===';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR during trigger test: %', SQLERRM;
        -- Try to clean up in case of error
        DROP TABLE IF EXISTS public.test_updated_at_trigger;
        RAISE;
END $$;