import { NextRequest, NextResponse } from 'next/server'
import { processCSPViolation, type CSPViolationReport } from '@/lib/security/csp-utils'
import { logger } from '@/lib/logger'

/**
 * CSP Violation Report endpoint
 * Receives and processes Content Security Policy violation reports
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the CSP violation report
    const report: CSPViolationReport = await request.json()
    
    // Validate report structure
    if (!report['csp-report']) {
      logger.warn('Invalid CSP report structure received')
      return NextResponse.json(
        { error: 'Invalid report structure' },
        { status: 400 }
      )
    }
    
    const violation = report['csp-report']
    
    // Log the violation
    logger.warn('CSP Violation detected', {
      metadata: {
        directive: violation['violated-directive'],
        blockedUri: violation['blocked-uri'],
        documentUri: violation['document-uri'],
        sourceFile: violation['source-file'],
        lineNumber: violation['line-number'],
        columnNumber: violation['column-number'],
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      }
    })
    
    // Process the violation
    processCSPViolation(report)
    
    // In production, you might want to:
    // 1. Store violations in database for analysis
    // 2. Send alerts for suspicious patterns
    // 3. Update CSP policy based on legitimate violations
    
    return NextResponse.json({ status: 'received' }, { status: 200 })
    
  } catch (error) {
    logger.error('Error processing CSP violation report', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handle OPTIONS request for CORS
 */
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}