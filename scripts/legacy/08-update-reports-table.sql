-- Update reports table to match the new requirements
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS report_type VARCHAR(100) DEFAULT 'complaint',
ADD COLUMN IF NOT EXISTS casino_id UUID REFERENCES casinos(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255),
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS amount_disputed DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS evidence_urls TEXT[],
ADD COLUMN IF NOT EXISTS contact_method VARCHAR(50) DEFAULT 'email';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_casino_id ON reports(casino_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

-- Update existing reports to have proper structure
UPDATE reports SET report_type = 'complaint' WHERE report_type IS NULL;
UPDATE reports SET priority = 'medium' WHERE priority IS NULL;
UPDATE reports SET category = 'payment_issue' WHERE category IS NULL;
