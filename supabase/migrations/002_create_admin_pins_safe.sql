-- Safe migration for admin PIN system
-- This will drop existing functions first to avoid conflicts

-- Step 1: Drop existing functions if they exist
DROP FUNCTION IF EXISTS verify_admin_pin(uuid, text);
DROP FUNCTION IF EXISTS verify_admin_pin(uuid, text, text);
DROP FUNCTION IF EXISTS set_admin_pin(uuid, text);
DROP FUNCTION IF EXISTS set_admin_pin(uuid, text, text);

-- Step 2: Create admin_pins table (if not exists)
CREATE TABLE IF NOT EXISTS admin_pins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pin_hash TEXT NOT NULL, -- Store hashed PIN, not plain text
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    failed_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Ensure one active PIN per user
    UNIQUE(user_id, is_active)
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_pins_user_id ON admin_pins(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_pins_active ON admin_pins(is_active);

-- Step 4: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_pins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_admin_pins_updated_at ON admin_pins;
CREATE TRIGGER trigger_update_admin_pins_updated_at
    BEFORE UPDATE ON admin_pins
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_pins_updated_at();

-- Step 6: Create RPC function to set admin PIN
CREATE OR REPLACE FUNCTION set_admin_pin(
    user_uuid UUID,
    pin_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Deactivate existing PINs for this user
    UPDATE admin_pins 
    SET is_active = false 
    WHERE user_id = user_uuid AND is_active = true;
    
    -- Insert new PIN
    INSERT INTO admin_pins (user_id, pin_hash, is_active)
    VALUES (user_uuid, pin_hash, true);
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

-- Step 7: Create RPC function to verify admin PIN
CREATE OR REPLACE FUNCTION verify_admin_pin(
    user_uuid UUID,
    pin_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    pin_record RECORD;
BEGIN
    -- Get active PIN for user
    SELECT * INTO pin_record
    FROM admin_pins
    WHERE user_id = user_uuid AND is_active = true;
    
    -- Check if PIN exists and matches
    IF pin_record IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if PIN is locked
    IF pin_record.locked_until IS NOT NULL AND pin_record.locked_until > NOW() THEN
        RETURN false;
    END IF;
    
    -- Check if PIN matches
    IF pin_record.pin_hash = pin_hash THEN
        -- Update last used and reset failed attempts
        UPDATE admin_pins 
        SET last_used_at = NOW(), failed_attempts = 0
        WHERE id = pin_record.id;
        RETURN true;
    ELSE
        -- Increment failed attempts
        UPDATE admin_pins 
        SET failed_attempts = failed_attempts + 1
        WHERE id = pin_record.id;
        
        -- Lock PIN after 5 failed attempts for 15 minutes
        IF pin_record.failed_attempts + 1 >= 5 THEN
            UPDATE admin_pins 
            SET locked_until = NOW() + INTERVAL '15 minutes'
            WHERE id = pin_record.id;
        END IF;
        
        RETURN false;
    END IF;
END;
$$;

-- Step 8: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON admin_pins TO authenticated;
GRANT EXECUTE ON FUNCTION set_admin_pin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_admin_pin(UUID, TEXT) TO authenticated;

-- Step 9: Verify the setup
SELECT 'Admin PIN system setup completed successfully' as status;
