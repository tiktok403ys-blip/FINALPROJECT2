-- Create rate_limits table for persistent rate limiting fallback
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at ON rate_limits(expires_at);

-- Enable Row Level Security
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access (rate limiting is server-side only)
CREATE POLICY "Service role can manage rate limits" ON rate_limits
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions to service role
GRANT ALL PRIVILEGES ON rate_limits TO service_role;

-- Create function to clean up expired entries
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limits WHERE expires_at < NOW();
END;
$$;

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_rate_limits_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_rate_limits_updated_at
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_rate_limits_updated_at();

-- Comment on table
COMMENT ON TABLE rate_limits IS 'Persistent rate limiting data storage for fallback when Redis is unavailable';
COMMENT ON COLUMN rate_limits.key IS 'Unique identifier for the rate limit entry (e.g., IP address or user ID)';
COMMENT ON COLUMN rate_limits.data IS 'JSON data containing request timestamps, violations, and block information';
COMMENT ON COLUMN rate_limits.expires_at IS 'When this rate limit entry expires and can be cleaned up';