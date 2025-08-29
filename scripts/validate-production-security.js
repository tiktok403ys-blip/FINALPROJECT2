#!/usr/bin/env node

/**
 * Production Security Validation Script
 * Run this script before deploying to production to ensure all security measures are in place
 */

const fs = require('fs')
const path = require('path')

console.log('🔒 Production Security Validation Starting...\n')

let allChecksPassed = true
const checks = []

// Check 1: Environment Variables
function checkEnvironmentVariables() {
  console.log('📋 Checking Environment Variables...')
  
  const requiredEnvVars = [
    'ADMIN_SUBDOMAIN',
    'NEXT_PUBLIC_SITE_DOMAIN',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  const missingVars = []
  
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName)
    }
  })
  
  if (missingVars.length > 0) {
    console.log(`❌ Missing environment variables: ${missingVars.join(', ')}`)
    checks.push({ name: 'Environment Variables', status: 'FAILED', details: missingVars })
    allChecksPassed = false
  } else {
    console.log('✅ All required environment variables are set')
    checks.push({ name: 'Environment Variables', status: 'PASSED' })
  }
}

// Check 2: Admin Subdomain Configuration
function checkAdminSubdomain() {
  console.log('\n🌐 Checking Admin Subdomain Configuration...')
  
  const adminSubdomain = process.env.ADMIN_SUBDOMAIN
  const siteDomain = process.env.NEXT_PUBLIC_SITE_DOMAIN
  
  if (!adminSubdomain || !siteDomain) {
    console.log('❌ Admin subdomain or site domain not configured')
    checks.push({ name: 'Admin Subdomain', status: 'FAILED', details: 'Missing configuration' })
    allChecksPassed = false
    return
  }
  
  if (adminSubdomain === siteDomain) {
    console.log('❌ Admin subdomain cannot be the same as main site domain')
    checks.push({ name: 'Admin Subdomain', status: 'FAILED', details: 'Subdomain conflict' })
    allChecksPassed = false
  } else {
    console.log(`✅ Admin subdomain configured: ${adminSubdomain}`)
    console.log(`✅ Main site domain: ${siteDomain}`)
    checks.push({ name: 'Admin Subdomain', status: 'PASSED' })
  }
}

// Check 3: Security Files
function checkSecurityFiles() {
  console.log('\n🛡️ Checking Security Files...')
  
  const requiredFiles = [
    'middleware.ts',
    'lib/security/minimal-security.ts',
    'lib/auth/admin-route-guard.ts',
    'components/admin/protected-route.tsx'
  ]
  
  const missingFiles = []
  
  requiredFiles.forEach(filePath => {
    if (!fs.existsSync(path.join(process.cwd(), filePath))) {
      missingFiles.push(filePath)
    }
  })
  
  if (missingFiles.length > 0) {
    console.log(`❌ Missing security files: ${missingFiles.join(', ')}`)
    checks.push({ name: 'Security Files', status: 'FAILED', details: missingFiles })
    allChecksPassed = false
  } else {
    console.log('✅ All required security files exist')
    checks.push({ name: 'Security Files', status: 'PASSED' })
  }
}

// Check 4: Middleware Configuration
function checkMiddlewareConfiguration() {
  console.log('\n🔧 Checking Middleware Configuration...')
  
  try {
    const middlewarePath = path.join(process.cwd(), 'middleware.ts')
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8')
    
    const requiredPatterns = [
      'pathname.startsWith(\'/admin\')',
      'new NextResponse(\'Not Found\', { status: 404 })',
      'admin_users',
      'isAdminSubdomain'
    ]
    
    const missingPatterns = []
    
    requiredPatterns.forEach(pattern => {
      if (!middlewareContent.includes(pattern)) {
        missingPatterns.push(pattern)
      }
    })
    
    if (missingPatterns.length > 0) {
      console.log(`❌ Middleware missing required patterns: ${missingPatterns.join(', ')}`)
      checks.push({ name: 'Middleware Configuration', status: 'FAILED', details: missingPatterns })
      allChecksPassed = false
    } else {
      console.log('✅ Middleware properly configured for admin protection')
      checks.push({ name: 'Middleware Configuration', status: 'PASSED' })
    }
  } catch (error) {
    console.log(`❌ Error reading middleware: ${error.message}`)
    checks.push({ name: 'Middleware Configuration', status: 'FAILED', details: error.message })
    allChecksPassed = false
  }
}

// Check 5: Package.json Security
function checkPackageSecurity() {
  console.log('\n📦 Checking Package Security...')
  
  try {
    const packagePath = path.join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    
    // Check for security-related packages
    const securityPackages = [
      '@supabase/ssr',
      '@supabase/supabase-js',
      'jose',
      'bcryptjs'
    ]
    
    const missingPackages = []
    
    securityPackages.forEach(pkg => {
      if (!packageJson.dependencies[pkg] && !packageJson.devDependencies[pkg]) {
        missingPackages.push(pkg)
      }
    })
    
    if (missingPackages.length > 0) {
      console.log(`❌ Missing security packages: ${missingPackages.join(', ')}`)
      checks.push({ name: 'Package Security', status: 'FAILED', details: missingPackages })
      allChecksPassed = false
    } else {
      console.log('✅ All required security packages installed')
      checks.push({ name: 'Package Security', status: 'PASSED' })
    }
  } catch (error) {
    console.log(`❌ Error reading package.json: ${error.message}`)
    checks.push({ name: 'Package Security', status: 'FAILED', details: error.message })
    allChecksPassed = false
  }
}

// Run all checks
checkEnvironmentVariables()
checkAdminSubdomain()
checkSecurityFiles()
checkMiddlewareConfiguration()
checkPackageSecurity()

// Summary
console.log('\n' + '='.repeat(60))
console.log('📊 SECURITY VALIDATION SUMMARY')
console.log('='.repeat(60))

checks.forEach(check => {
  const status = check.status === 'PASSED' ? '✅' : '❌'
  console.log(`${status} ${check.name}: ${check.status}`)
  if (check.details) {
    console.log(`   Details: ${Array.isArray(check.details) ? check.details.join(', ') : check.details}`)
  }
})

console.log('\n' + '='.repeat(60))

if (allChecksPassed) {
  console.log('🎉 ALL SECURITY CHECKS PASSED!')
  console.log('✅ Your application is ready for production deployment')
  process.exit(0)
} else {
  console.log('🚨 SECURITY CHECKS FAILED!')
  console.log('❌ Please fix the issues above before deploying to production')
  process.exit(1)
}
