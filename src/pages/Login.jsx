import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError, lockedUntil, resetLockout } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')
  
  const [isMounted, setIsMounted] = useState(false)
  const [success, setSuccess] = useState(false)
  const [lockout, setLockout] = useState(false)
  const [lockoutTimer, setLockoutTimer] = useState(300) // 5 minutes in seconds
  const [shake, setShake] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    clearError()
    setLocalError('')

    // Check if store already has a lockout
    const now = Date.now()
    if (lockedUntil && now < lockedUntil) {
      setLockout(true)
      setLockoutTimer(Math.ceil((lockedUntil - now) / 1000))
    }
  }, [lockedUntil, clearError])

  // Lockout Countdown Timer
  useEffect(() => {
    let interval = null
    if (lockout && lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            setLockout(false)
            resetLockout()
            return 300
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [lockout, lockoutTimer, resetLockout])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    clearError()

    if (lockout) {
      setLocalError('Account is locked. Please wait.')
      return
    }

    const loginSuccess = await login({ email, password, remember_me: remember })

    if (loginSuccess) {
      setSuccess(true)
      // Transition delay for the sweep animation to complete
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
    } else {
      // Login failed
      setShake(true)
      setTimeout(() => setShake(false), 300)

      // Re-evaluate lockout
      const now = Date.now()
      if (useAuthStore.getState().lockedUntil && now < useAuthStore.getState().lockedUntil) {
        setLockout(true)
        setLockoutTimer(Math.ceil((useAuthStore.getState().lockedUntil - now) / 1000))
      }
    }
  }

  return (
    <div className="antialiased overflow-hidden min-h-screen bg-[#0e1417] text-[#dde3e8] relative">
      {/* Page Transition Layer */}
      <div id="success-sweep" className={success ? 'sweep-active' : ''}></div>
      
      <main className="min-h-screen flex flex-col md:flex-row">
        {/* Left Panel: Branding & Animation */}
        <section className="relative hidden md:flex md:w-1/2 lg:w-3/5 items-center justify-center overflow-hidden bg-[#090f12]">
          {/* Mesh Drift Background Layer */}
          <div className="absolute inset-0 w-full h-full opacity-40 mesh-drift"></div>
          
          {/* Branding Overlay */}
          <div className="relative z-10 flex flex-col items-center text-center px-[24px] max-w-lg">
            <div className="mb-[16px]">
              <span className={`text-[48px] font-display logo-gradient animate-fade-in ${isMounted ? 'active' : ''}`}>◈</span>
            </div>
            <h1 className="text-[48px] font-headline font-bold mb-[4px] tracking-tight text-on-surface animate-fade-up" style={{ animationDelay: '100ms', opacity: isMounted ? 1 : 0 }}>
              CryptoAI Trader
            </h1>
            <p className="text-[16px] font-body text-on-surface-variant max-w-md animate-fade-in" style={{ animationDelay: '200ms', opacity: isMounted ? 0.7 : 0 }}>
              The next generation of precision trading. Harness the power of neural networks to navigate volatile markets with institutional-grade clarity.
            </p>
            
            {/* Performance Stats */}
            <div className="mt-[40px] grid grid-cols-2 gap-[24px] w-full animate-fade-up" style={{ animationDelay: '300ms', opacity: isMounted ? 1 : 0 }}>
              <div className="glass-panel p-[16px] rounded-xl text-left border-opacity-10">
                <p className="text-[12px] font-semibold text-primary uppercase tracking-widest mb-[8px]">Execution</p>
                <p className="text-[20px] font-headline font-bold">&lt; 14ms</p>
              </div>
              <div className="glass-panel p-[16px] rounded-xl text-left border-opacity-10">
                <p className="text-[12px] font-semibold text-primary uppercase tracking-widest mb-[8px]">AI Confidence</p>
                <p className="text-[20px] font-headline font-bold">98.4%</p>
              </div>
            </div>
          </div>
          
          {/* Decorative corner accent */}
          <div className="absolute bottom-0 left-0 p-[24px] animate-fade-in" style={{ animationDelay: '800ms', opacity: isMounted ? 0.4 : 0 }}>
            <p className="text-[12px] font-semibold text-outline opacity-40">SYSTEM STATUS: OPTIMAL // ENCRYPTED NODE 0x4F</p>
          </div>
        </section>

        {/* Right Panel: Login Form */}
        <section className="w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center items-center p-4 md:p-8 lg:p-12 bg-surface relative min-h-screen">
          {/* Mobile Branding (Hidden on Desktop) */}
          <div className="md:hidden flex flex-col items-center mb-6">
            <span className="text-3xl font-headline logo-gradient mb-1">◈</span>
            <h2 className="text-xl font-headline font-bold text-on-surface">CryptoAI Trader</h2>
          </div>

          <div className="w-full max-w-md">
            <div className="mb-6 flex justify-between items-center bg-surface-container-lowest/50 p-4 rounded-xl border border-outline-variant/30">
              <div>
                <h2 className="text-xl md:text-2xl font-headline font-bold text-on-surface mb-0.5 animate-fade-up" style={{ animationDelay: '150ms', opacity: isMounted ? 1 : 0 }}>Welcome back</h2>
                <p className="text-xs font-body text-on-surface-variant animate-fade-in" style={{ animationDelay: '250ms', opacity: isMounted ? 0.7 : 0 }}>Access your AI Terminal.</p>
              </div>
              <Link className="text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center space-x-1" to="/auth/signup">
                <span>REGISTER</span>
                <span className="material-symbols-outlined text-xs">person_add</span>
              </Link>
            </div>

            {/* Error Banner */}
            {(localError || error) && !lockout && (
              <div className="bg-error-container text-on-error-container p-3 rounded-xl mb-4 overflow-hidden transition-all duration-200">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <p className="text-xs font-medium">{localError || error}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              {/* Email Address */}
              <div className="space-y-1.5 animate-fade-up" style={{ animationDelay: '350ms', opacity: isMounted ? 1 : 0 }}>
                <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="email">Email Address</label>
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-xs md:text-sm transition-all duration-300 outline-none focus:border-primary-container focus:ring-3 focus:ring-primary-container/15"
                    id="email"
                    placeholder="name@company.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className={`space-y-1.5 animate-fade-up ${shake ? 'shake-error' : ''}`} style={{ animationDelay: '430ms', opacity: isMounted ? 1 : 0 }}>
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="password">Password</label>
                  <a className="text-[11px] font-semibold text-primary-container hover-underline transition-colors" href="#forgot">Forgot password?</a>
                </div>
                <div className="relative group">
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-xs md:text-sm transition-all duration-300 pr-12 outline-none focus:border-primary-container focus:ring-3 focus:ring-primary-container/15"
                    id="password"
                    placeholder="••••••••"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                    onClick={() => setShowPassword(prev => !prev)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-lg transition-all duration-300">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2 pt-1 animate-fade-in" style={{ animationDelay: '510ms', opacity: isMounted ? 0.7 : 0 }}>
                <div className="relative flex items-center custom-checkbox-container">
                  <input
                    className="peer opacity-0 absolute h-4 w-4 cursor-pointer"
                    id="remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <div className="h-4 w-4 border border-outline-variant rounded bg-surface-container-lowest peer-checked:bg-primary-container peer-checked:border-primary-container transition-all"></div>
                  <svg className="checkmark-svg absolute h-4 w-4 text-[#001f2a] p-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <label className="text-xs font-body text-on-surface-variant cursor-pointer select-none" htmlFor="remember">Remember me for 30 days</label>
              </div>

              {/* Submit Button */}
              <div className="pt-2 animate-fade-up" style={{ animationDelay: '590ms', opacity: isMounted ? 1 : 0 }}>
                <button
                  className={`w-full font-bold py-3 rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer ${
                    success 
                      ? 'bg-[#4ade80] text-black shadow-lg shadow-green-500/20' 
                      : 'shimmer-btn-flow text-on-primary-container'
                  }`}
                  id="submitBtn"
                  disabled={isLoading || success || lockout}
                  type="submit"
                >
                  {!success && !isLoading && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold uppercase tracking-widest">SIGN IN</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </div>
                  )}
                  {isLoading && (
                    <div className="flex items-center space-x-2">
                      <svg className="animate-spin h-4 w-4 text-on-primary-container" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"></path>
                      </svg>
                      <span className="text-xs font-semibold uppercase tracking-widest">Signing in...</span>
                    </div>
                  )}
                  {success && (
                    <div className="flex items-center space-x-2">
                      <span className="material-symbols-outlined scale-110">check_circle</span>
                      <span className="text-xs font-semibold uppercase tracking-widest">Authorized</span>
                    </div>
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-4 animate-fade-in flex items-center justify-center" style={{ animationDelay: '650ms', opacity: isMounted ? 0.7 : 0 }}>
              <div className="absolute w-full flex items-center justify-center">
                <div className="h-[1px] bg-outline-variant w-1/2 absolute left-0 origin-left"></div>
                <div className="h-[1px] bg-outline-variant w-1/2 absolute right-0 origin-right"></div>
              </div>
              <span className="relative z-10 bg-[#0e1417] px-3 text-[10px] font-semibold text-outline uppercase tracking-widest">or</span>
            </div>

            {/* Google OAuth */}
            <button className="google-btn w-full glass-panel text-on-surface py-2.5 rounded-xl flex items-center justify-center space-x-3 hover:bg-[#162035] hover:border-[#00C8FF] transition-all active:scale-[0.98] animate-fade-in cursor-pointer" style={{ animationDelay: '650ms', opacity: isMounted ? 1 : 0 }}>
              <svg className="w-4 h-4 transition-transform duration-500" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              <span className="text-xs font-body">Continue with Google</span>
            </button>

            {/* Footer Links */}
            <div className="mt-6 text-center animate-fade-in" style={{ animationDelay: '700ms', opacity: isMounted ? 0.7 : 0 }}>
              <p className="text-xs font-body text-on-surface-variant">
                Don't have an account? 
                <Link className="text-primary-container font-semibold hover-underline ml-1" to="/auth/signup">Create one now</Link>
              </p>
            </div>
          </div>

          {/* Account Locked State UI */}
          {lockout && (
            <div className="absolute inset-0 bg-[#0e1417]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-[40px] text-center">
              <div className="mb-[24px]">
                <span className="material-symbols-outlined text-[64px] text-error bounce-padlock">lock</span>
              </div>
              <h3 className="text-[32px] font-headline font-bold text-on-surface mb-[4px]">Security Lockout</h3>
              <p className="text-[16px] font-body text-on-surface-variant mb-[40px]">Too many failed attempts. Your terminal access is temporarily suspended.</p>
              <div className="animate-pulse bg-error-container text-on-error-container px-[24px] py-2 rounded-full text-[12px] font-semibold uppercase tracking-widest">
                Retry in {formatTime(lockoutTimer)}
              </div>
            </div>
          )}

          {/* Footer Small Print */}
          <div className="mt-[64px] md:mt-auto pt-[24px] flex space-x-[24px] opacity-40 animate-fade-in" style={{ animationDelay: '800ms', opacity: isMounted ? 0.4 : 0 }}>
            <a className="text-[12px] font-semibold hover:opacity-100 transition-opacity" href="#privacy">Privacy Policy</a>
            <a className="text-[12px] font-semibold hover:opacity-100 transition-opacity" href="#terms">Terms of Service</a>
          </div>
        </section>
      </main>
    </div>
  )
}
