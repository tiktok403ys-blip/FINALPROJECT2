#!/usr/bin/env node

/**
 * Verification Script: Function Search Path Security Fix
 * Purpose: Verify that all SECURITY DEFINER functions have immutable search_path
 * Usage: node verify-search-path-fix.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing Supabase configuration');
    console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySearchPathFix() {
    console.log('🔍 Verifying Function Search Path Security Fix');
    console.log('===============================================');
    console.log('');

    try {
        // Test the verification function we created
        console.log('📊 Running security analysis...');
        const { data: functions, error } = await supabase
            .rpc('check_mutable_search_path_functions');

        if (error) {
            console.error('❌ Error calling verification function:', error.message);
            console.error('This might mean the verification function was not created properly.');
            
            // Try alternative approach - direct SQL query
            console.log('\n🔄 Trying alternative verification method...');
            return await alternativeVerification();
        }

        if (!functions || functions.length === 0) {
            console.log('ℹ️  No functions found in public schema');
            return;
        }

        // Analyze results
        const securityDefinerFunctions = functions.filter(f => f.security_definer);
        const vulnerableFunctions = functions.filter(f => 
            f.security_definer && f.recommendation.includes('CRITICAL')
        );
        const secureFunctions = functions.filter(f => 
            f.security_definer && f.recommendation.includes('OK')
        );

        console.log('📈 Analysis Results:');
        console.log('==================');
        console.log(`Total public functions: ${functions.length}`);
        console.log(`SECURITY DEFINER functions: ${securityDefinerFunctions.length}`);
        console.log(`Secure functions (with immutable search_path): ${secureFunctions.length}`);
        console.log(`Vulnerable functions (mutable search_path): ${vulnerableFunctions.length}`);
        console.log('');

        if (vulnerableFunctions.length === 0) {
            console.log('🎉 SUCCESS: All SECURITY DEFINER functions are secure!');
            console.log('✅ No mutable search_path vulnerabilities detected');
            console.log('✅ Security Advisory warnings should be resolved');
            console.log('');
            
            // Show secure functions
            if (secureFunctions.length > 0) {
                console.log('🔒 Secure Functions (with immutable search_path):');
                secureFunctions.forEach(func => {
                    console.log(`  ✓ ${func.function_name}(${func.function_args})`);
                    console.log(`    search_path: ${func.current_search_path}`);
                });
                console.log('');
            }
        } else {
            console.log('⚠️  WARNING: Security vulnerabilities still exist!');
            console.log('');
            console.log('🚨 Vulnerable Functions (need immediate attention):');
            vulnerableFunctions.forEach(func => {
                console.log(`  ❌ ${func.function_name}(${func.function_args})`);
                console.log(`     Issue: ${func.recommendation}`);
                console.log(`     Current search_path: ${func.current_search_path}`);
            });
            console.log('');
        }

        // Test specific function that was mentioned in the security warning
        console.log('🎯 Testing cleanup_expired_rate_limits function specifically:');
        const cleanupFunction = functions.find(f => f.function_name === 'cleanup_expired_rate_limits');
        if (cleanupFunction) {
            console.log(`  Function: ${cleanupFunction.function_name}(${cleanupFunction.function_args})`);
            console.log(`  Security Definer: ${cleanupFunction.security_definer}`);
            console.log(`  Has search_path: ${cleanupFunction.has_search_path}`);
            console.log(`  Current search_path: ${cleanupFunction.current_search_path}`);
            console.log(`  Status: ${cleanupFunction.recommendation}`);
            
            if (cleanupFunction.recommendation.includes('OK')) {
                console.log('  ✅ cleanup_expired_rate_limits is now secure!');
            } else {
                console.log('  ❌ cleanup_expired_rate_limits still needs fixing!');
            }
        } else {
            console.log('  ℹ️  cleanup_expired_rate_limits function not found');
        }
        console.log('');

        // Summary and next steps
        console.log('📋 Summary:');
        console.log('=========');
        if (vulnerableFunctions.length === 0) {
            console.log('✅ All security warnings for mutable search_path should be resolved');
            console.log('✅ Ready for Supabase Security Advisor re-scan');
            console.log('');
            console.log('🔄 Next Steps:');
            console.log('1. Re-run Supabase Security Advisor to confirm warnings are gone');
            console.log('2. Monitor with: SELECT * FROM check_mutable_search_path_functions();');
            console.log('3. Set up automated security checks in CI/CD pipeline');
        } else {
            console.log(`❌ ${vulnerableFunctions.length} functions still vulnerable`);
            console.log('❌ Security warnings will persist until all functions are fixed');
        }

        return vulnerableFunctions.length === 0;

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        console.log('\n🔄 Trying alternative verification method...');
        return await alternativeVerification();
    }
}

// Alternative verification using exec_sql if available
async function alternativeVerification() {
    try {
        console.log('📊 Running alternative security analysis...');
        
        // Try to get function information directly
        const { data, error } = await supabase
            .rpc('exec_sql', {
                query: `
                    SELECT 
                        p.proname as function_name,
                        pg_get_function_identity_arguments(p.oid) as function_args,
                        p.prosecdef as security_definer,
                        EXISTS (
                            SELECT 1 FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS config
                            WHERE config LIKE 'search_path=%'
                        ) as has_search_path,
                        COALESCE(
                            (SELECT config FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS config
                             WHERE config LIKE 'search_path=%' LIMIT 1),
                            'NOT SET'
                        ) as current_search_path
                    FROM pg_proc p
                    JOIN pg_namespace n ON p.pronamespace = n.oid
                    WHERE n.nspname = 'public'
                    AND p.prosecdef = true
                    ORDER BY p.proname;
                `
            });

        if (error) {
            console.error('❌ Alternative verification also failed:', error.message);
            console.log('');
            console.log('📝 Manual Verification Steps:');
            console.log('1. Connect to your Supabase database');
            console.log('2. Run: SELECT * FROM check_mutable_search_path_functions();');
            console.log('3. Check if cleanup_expired_rate_limits has search_path set');
            return false;
        }

        if (!data || data.length === 0) {
            console.log('ℹ️  No SECURITY DEFINER functions found');
            console.log('✅ This means no mutable search_path vulnerabilities exist');
            return true;
        }

        const vulnerableFunctions = data.filter(f => !f.has_search_path);
        const secureFunctions = data.filter(f => f.has_search_path);

        console.log('📈 Alternative Analysis Results:');
        console.log('==============================');
        console.log(`SECURITY DEFINER functions found: ${data.length}`);
        console.log(`Secure functions (with search_path): ${secureFunctions.length}`);
        console.log(`Vulnerable functions (without search_path): ${vulnerableFunctions.length}`);
        console.log('');

        if (vulnerableFunctions.length === 0) {
            console.log('🎉 SUCCESS: All SECURITY DEFINER functions have search_path set!');
            console.log('✅ Security Advisory warnings should be resolved');
        } else {
            console.log('⚠️  WARNING: Some functions still vulnerable:');
            vulnerableFunctions.forEach(func => {
                console.log(`  ❌ ${func.function_name}(${func.function_args})`);
            });
        }

        // Check cleanup_expired_rate_limits specifically
        const cleanupFunction = data.find(f => f.function_name === 'cleanup_expired_rate_limits');
        if (cleanupFunction) {
            console.log('');
            console.log('🎯 cleanup_expired_rate_limits status:');
            console.log(`  Has search_path: ${cleanupFunction.has_search_path}`);
            console.log(`  Current search_path: ${cleanupFunction.current_search_path}`);
            if (cleanupFunction.has_search_path) {
                console.log('  ✅ cleanup_expired_rate_limits is now secure!');
            } else {
                console.log('  ❌ cleanup_expired_rate_limits still needs fixing!');
            }
        }

        return vulnerableFunctions.length === 0;

    } catch (error) {
        console.error('❌ Alternative verification failed:', error.message);
        console.log('');
        console.log('📝 Manual Verification Required:');
        console.log('Please check your Supabase dashboard Security Advisor');
        console.log('Or run this SQL query in your database:');
        console.log('');
        console.log('SELECT proname, prosecdef, proconfig FROM pg_proc p');
        console.log('JOIN pg_namespace n ON p.pronamespace = n.oid');
        console.log('WHERE n.nspname = \'public\' AND p.prosecdef = true;');
        return false;
    }
}

// Main execution
async function main() {
    console.log('🚀 Starting Function Search Path Security Verification');
    console.log('======================================================');
    console.log('');

    const success = await verifySearchPathFix();

    console.log('');
    console.log('🏁 Verification completed');
    console.log('========================');
    
    if (success) {
        console.log('✅ All security checks passed!');
        console.log('✅ Function Search Path Mutable warnings should be resolved');
    } else {
        console.log('⚠️  Some security issues may still exist');
        console.log('📋 Please check Supabase Security Advisor for current status');
    }
}

// Run the script
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Script execution failed:', error.message);
        process.exit(1);
    });
}

module.exports = { verifySearchPathFix, alternativeVerification };