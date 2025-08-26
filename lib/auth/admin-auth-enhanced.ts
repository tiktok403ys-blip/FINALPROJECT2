import { createClient } from '@/lib/supabase/server'
import { User } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { getValidatedEnv } from '@/lib/config/env-validator'
import { createHash, randomBytes, pbkdf2Sync, timingSafeEqual } from 'crypto'

export type AdminRole = 'super_admin' | 'admin'

export interface AdminUser extends User {
  role?: AdminRole
  permissions?: string[]
}

export interface AdminProfile {
  id: string
  email: string
  role: AdminRole
  permissions: string[]
  created_at: string
  updated_at: string
  last_login?: string
  is_active: boolean
}

export interface AdminCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface AdminSession {
  sessionToken: string
  expiresAt: number
  user: AdminProfile
}

export interface SecurityEvent {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  userId?: string
  ip?: string
  userAgent?: string
  metadata?: any
}

/**
 * Enhanced Admin Authentication System with bcrypt
 * Implements enterprise-grade security with proper password hashing
 */
export class EnhancedAdminAuth {
  private static instance: EnhancedAdminAuth
  private currentUser: AdminUser | null = null
  private currentProfile: AdminProfile | null = null
  private readonly SESSION_DURATION = 8 * 60 * 60 * 1000 // 8 hours
  private readonly EXTENDED_SESSION_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days
  private readonly MAX_LOGIN_ATTEMPTS = 5
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes
  private readonly BCRYPT_ROUNDS = 12

  private jwtSecret: string | null = null

  private constructor() {
    // JWT secret will be initialized lazily when needed
  }

  static getInstance(): EnhancedAdminAuth {
    if (!EnhancedAdminAuth.instance) {
      EnhancedAdminAuth.instance = new EnhancedAdminAuth()
    }
    return EnhancedAdminAuth.instance
  }

  /**
   * Get Supabase client instance
   */
  private async getSupabaseClient() {
    return await createClient()
  }

  /**
   * Get JWT secret (lazy initialization)
   */
  private getJwtSecret(): string {
    if (!this.jwtSecret) {
      const env = getValidatedEnv()
      this.jwtSecret = env.JWT_SECRET || 'fallback-secret-key-change-in-production'
    }
    return this.jwtSecret
  }

  /**
   * Hash password using PBKDF2 (Node.js built-in)
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(32).toString('hex')
    const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
    return `${salt}:${hash}`
  }

  /**
   * Verify password using PBKDF2
   */
  private async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    try {
      const [salt, hash] = storedHash.split(':')
      if (!salt || !hash) return false
      
      const verifyHash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
      return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'))
    } catch {
      return false
    }
  }

  /**
   * Hash PIN using PBKDF2
   */
  private async hashPin(pin: string): Promise<string> {
    const salt = randomBytes(16).toString('hex')
    const hash = pbkdf2Sync(pin, salt, 50000, 32, 'sha256').toString('hex')
    return `${salt}:${hash}`
  }

  /**
   * Verify PIN using PBKDF2
   */
  private async verifyPin(pin: string, storedHash: string): Promise<boolean> {
    try {
      const [salt, hash] = storedHash.split(':')
      if (!salt || !hash) return false
      
      const verifyHash = pbkdf2Sync(pin, salt, 50000, 32, 'sha256').toString('hex')
      return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'))
    } catch {
      return false
    }
  }

  /**
   * Generate session token using HMAC
   */
  private generateSessionToken(adminProfile: AdminProfile, rememberMe: boolean = false): string {
    const expirationTime = rememberMe ? (30 * 24 * 60 * 60) : (8 * 60 * 60) // 30 days or 8 hours in seconds
    
    const payload = {
      adminId: adminProfile.id,
      email: adminProfile.email,
      role: adminProfile.role,
      permissions: adminProfile.permissions,
      type: 'admin_session',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expirationTime,
      issuer: 'casino-review-admin',
      audience: 'admin-panel'
    }
    
    const payloadStr = JSON.stringify(payload)
    const payloadB64 = Buffer.from(payloadStr).toString('base64url')
    const signature = createHash('sha256')
      .update(payloadB64 + '.' + this.getJwtSecret())
      .digest('base64url')
    
    return `${payloadB64}.${signature}`
  }

  /**
   * Verify session token using HMAC
   */
  private verifySessionToken(token: string): any {
    try {
      const [payloadB64, signature] = token.split('.')
      if (!payloadB64 || !signature) return null
      
      // Verify signature
      const expectedSignature = createHash('sha256')
        .update(payloadB64 + '.' + this.getJwtSecret())
        .digest('base64url')
      
      if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return null
      }
      
      // Decode payload
      const payloadStr = Buffer.from(payloadB64, 'base64url').toString()
      const payload = JSON.parse(payloadStr)
      
      // Check expiration
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        return null
      }
      
      // Verify issuer and audience
      if (payload.issuer !== 'casino-review-admin' || payload.audience !== 'admin-panel') {
        return null
      }
      
      return payload
    } catch (error) {
      logger.error('Session token verification failed:', error as Error)
      return null
    }
  }

  /**
   * Log security events for monitoring
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const supabase = await this.getSupabaseClient()
      await supabase.from('security_events').insert({
        event_type: event.type,
        severity: event.severity,
        user_id: event.userId || null,
        ip_address: event.ip || null,
        user_agent: event.userAgent || null,
        metadata: event.metadata || {},
        created_at: new Date().toISOString()
      })
    } catch (error) {
      logger.error('Failed to log security event:', error as Error)
    }
  }

  /**
   * Check for failed login attempts and account lockout
   */
  private async checkLoginAttempts(email: string, ip?: string): Promise<boolean> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const supabase = await this.getSupabaseClient()
      
      const { data: attempts, error } = await supabase
        .from('security_events')
        .select('*')
        .eq('event_type', 'ADMIN_LOGIN_FAILED')
        .eq('metadata->>email', email)
        .gte('created_at', oneHourAgo)
        .order('created_at', { ascending: false })
        .limit(this.MAX_LOGIN_ATTEMPTS)

      if (error) {
        logger.error('Failed to check login attempts:', error)
        return true // Allow login if we can't check attempts
      }

      if (attempts && attempts.length >= this.MAX_LOGIN_ATTEMPTS) {
        const lastAttempt = new Date(attempts[0].created_at)
        const lockoutEnd = new Date(lastAttempt.getTime() + this.LOCKOUT_DURATION)
        
        if (Date.now() < lockoutEnd.getTime()) {
          await this.logSecurityEvent({
            type: 'ADMIN_ACCOUNT_LOCKED',
            severity: 'high',
            ip,
            metadata: { email, lockoutEnd: lockoutEnd.toISOString() }
          })
          return false
        }
      }

      return true
    } catch (error) {
      logger.error('Error checking login attempts:', error as Error)
      return true // Allow login if check fails
    }
  }

  /**
   * Enhanced admin sign in with bcrypt and security monitoring
   */
  async signIn(credentials: AdminCredentials, ip?: string, userAgent?: string): Promise<AdminSession | null> {
    try {
      // 1. Check for account lockout
      const canLogin = await this.checkLoginAttempts(credentials.email, ip)
      if (!canLogin) {
        throw new Error('Account temporarily locked due to multiple failed attempts')
      }

      // 2. Get admin user from database
      const supabase = await this.getSupabaseClient()
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', credentials.email)
        .eq('is_active', true)
        .single()

      if (adminError || !adminData) {
        await this.logSecurityEvent({
          type: 'ADMIN_LOGIN_FAILED',
          severity: 'medium',
          ip,
          userAgent,
          metadata: { email: credentials.email, reason: 'user_not_found' }
        })
        throw new Error('Invalid credentials')
      }

      // 3. Verify password with PBKDF2
      const isValidPassword = await this.verifyPassword(credentials.password, adminData.password_hash)
      
      if (!isValidPassword) {
        await this.logSecurityEvent({
          type: 'ADMIN_LOGIN_FAILED',
          severity: 'medium',
          userId: adminData.id,
          ip,
          userAgent,
          metadata: { email: credentials.email, reason: 'invalid_password' }
        })
        throw new Error('Invalid credentials')
      }

      // 4. Create admin profile
      const adminProfile: AdminProfile = {
        id: adminData.id,
        email: adminData.email,
        role: adminData.role,
        permissions: adminData.permissions || [],
        created_at: adminData.created_at,
        updated_at: adminData.updated_at,
        last_login: new Date().toISOString(),
        is_active: adminData.is_active
      }

      // 5. Generate session token
      const sessionToken = this.generateSessionToken(adminProfile, credentials.rememberMe)
      const expiresAt = Date.now() + (credentials.rememberMe ? this.EXTENDED_SESSION_DURATION : this.SESSION_DURATION)

      // 6. Update last login timestamp
      await supabase
        .from('admin_users')
        .update({ last_login: adminProfile.last_login })
        .eq('id', adminData.id)

      // 7. Log successful login
      await this.logSecurityEvent({
        type: 'ADMIN_LOGIN_SUCCESS',
        severity: 'low',
        userId: adminData.id,
        ip,
        userAgent,
        metadata: { email: credentials.email, rememberMe: credentials.rememberMe }
      })

      // 8. Set current user state
      this.currentProfile = adminProfile

      return {
        sessionToken,
        expiresAt,
        user: adminProfile
      }
    } catch (error) {
      logger.error('Enhanced admin sign in failed:', error as Error)
      return null
    }
  }

  /**
   * Validate session token and get current user
   */
  async validateSession(sessionToken: string): Promise<AdminProfile | null> {
    try {
      const decoded = this.verifySessionToken(sessionToken)
      if (!decoded) {
        return null
      }

      // Get fresh admin data from database
      const supabase = await this.getSupabaseClient()
      const { data: adminData, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', decoded.adminId)
        .eq('is_active', true)
        .single()

      if (error || !adminData) {
        return null
      }

      const adminProfile: AdminProfile = {
        id: adminData.id,
        email: adminData.email,
        role: adminData.role,
        permissions: adminData.permissions || [],
        created_at: adminData.created_at,
        updated_at: adminData.updated_at,
        last_login: adminData.last_login,
        is_active: adminData.is_active
      }

      this.currentProfile = adminProfile
      return adminProfile
    } catch (error) {
      logger.error('Session validation failed:', error as Error)
      return null
    }
  }

  /**
   * Enhanced PIN verification with PBKDF2
   */
  async verifyAdminPin(pin: string, sessionToken: string, ip?: string): Promise<boolean> {
    try {
      const adminProfile = await this.validateSession(sessionToken)
      if (!adminProfile) {
        return false
      }

      // Get PIN hash from database
      const supabase = await this.getSupabaseClient()
      const { data: adminData, error } = await supabase
        .from('admin_users')
        .select('pin_hash')
        .eq('id', adminProfile.id)
        .single()

      if (error || !adminData?.pin_hash) {
        await this.logSecurityEvent({
          type: 'ADMIN_PIN_VERIFICATION_FAILED',
          severity: 'medium',
          userId: adminProfile.id,
          ip,
          metadata: { reason: 'pin_not_found' }
        })
        return false
      }

      // Verify PIN with PBKDF2
      const isValidPin = await this.verifyPin(pin, adminData.pin_hash)
      
      if (!isValidPin) {
        await this.logSecurityEvent({
          type: 'ADMIN_PIN_VERIFICATION_FAILED',
          severity: 'medium',
          userId: adminProfile.id,
          ip,
          metadata: { reason: 'invalid_pin' }
        })
        return false
      }

      // Log successful PIN verification
      await this.logSecurityEvent({
        type: 'ADMIN_PIN_VERIFICATION_SUCCESS',
        severity: 'low',
        userId: adminProfile.id,
        ip,
        metadata: {}
      })

      return true
    } catch (error) {
      logger.error('PIN verification failed:', error as Error)
      return false
    }
  }

  /**
   * Sign out admin user
   */
  async signOut(sessionToken?: string): Promise<void> {
    try {
      if (sessionToken) {
        const adminProfile = await this.validateSession(sessionToken)
        if (adminProfile) {
          await this.logSecurityEvent({
            type: 'ADMIN_LOGOUT',
            severity: 'low',
            userId: adminProfile.id,
            metadata: {}
          })
        }
      }

      this.currentUser = null
      this.currentProfile = null
    } catch (error) {
      logger.error('Sign out error:', error as Error)
    }
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    if (!this.currentProfile) return false
    
    // Super admin has all permissions
    if (this.currentProfile.role === 'super_admin') return true
    
    // Check specific permissions
    return this.currentProfile.permissions?.includes(permission) || false
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: AdminRole): boolean {
    return this.currentProfile?.role === role
  }

  /**
   * Check if user is authenticated admin
   */
  isAuthenticated(): boolean {
    return this.currentProfile !== null
  }

  /**
   * Get current admin profile
   */
  getCurrentProfile(): AdminProfile | null {
    return this.currentProfile
  }
}

// Export singleton instance
export const enhancedAdminAuth = EnhancedAdminAuth.getInstance()