import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function SignUp() {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError } = useAuthStore()
  
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    whatsappNumber: '',
    agreeTerms: false
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [countryCode, setCountryCode] = useState('+1')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [localError, setLocalError] = useState('')
  const [success, setSuccess] = useState(false)
  
  // Shaking states for individual fields
  const [shakeFields, setShakeFields] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
    terms: false
  })

  const dropdownRef = useRef(null)

  useEffect(() => {
    // Trigger fade-up animations on mount
    setIsMounted(true)
    clearError()
    setLocalError('')

    // Close dropdown on click outside
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [clearError])

  // Password strength calculation
  const getPasswordStrength = () => {
    const val = form.password
    if (!val) return 0
    let strength = 0
    if (val.length > 5) strength = 33
    if (val.length > 8 && /[A-Z]/.test(val)) strength = 66
    if (val.length > 10 && /[!@#$%^&*(),.?":{}|<>]/.test(val)) strength = 100
    return strength
  }

  const strength = getPasswordStrength()
  const strengthBarColor = strength <= 33 ? '#FF3D57' : strength <= 66 ? '#FFB300' : '#00E676'

  // Field change handler
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    clearError()

    let hasValidationErrors = false
    const newShake = { ...shakeFields }

    // Manual client-side validation for premium interactive shake effect
    if (!form.fullName.trim()) {
      newShake.fullName = true
      hasValidationErrors = true
    }
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
      newShake.email = true
      hasValidationErrors = true
    }
    if (form.password.length < 6) {
      newShake.password = true
      hasValidationErrors = true
    }
    if (form.password !== form.confirmPassword) {
      newShake.confirmPassword = true
      hasValidationErrors = true
    }
    if (!form.agreeTerms) {
      newShake.terms = true
      hasValidationErrors = true
    }

    if (hasValidationErrors) {
      setShakeFields(newShake)
      setLocalError('Please correct the highlighted fields.')
      // Reset shake state after animation runs
      setTimeout(() => {
        setShakeFields({
          fullName: false,
          email: false,
          password: false,
          confirmPassword: false,
          terms: false
        })
      }, 300)
      return
    }

    // Call store register
    const registerSuccess = await register({
      full_name: form.fullName,
      email: form.email,
      password: form.password,
      whatsapp_number: form.whatsappNumber ? `${countryCode}${form.whatsappNumber}` : ''
    })

    if (registerSuccess) {
      setSuccess(true)
      // Wait for dramatic success effect, then navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
    }
  }

  return (
    <main className="flex h-screen w-full select-none bg-surface-dim overflow-hidden">
      {/* Left Panel: Brand & Visuals (55%) */}
      <section className="relative hidden md:flex flex-col w-[55%] h-full p-[64px] overflow-hidden bg-[#080C18]">
        <div className="mesh-bg absolute inset-0 z-0"></div>
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-[4px]">
            <div className="pulse-orb w-10 h-10 flex items-center justify-center rounded-full bg-primary-container/20 border border-primary-container/30">
              <span className="text-[48px] font-display logo-gradient leading-none">◈</span>
            </div>
            <span className="text-[20px] font-headline font-bold text-on-surface ml-[8px]">CryptoAI Trader</span>
          </div>
          
          <div className="mt-auto max-w-xl">
            <h1 className={`text-[48px] font-headline font-bold leading-tight mb-[24px] fade-up ${isMounted ? 'active' : ''}`} id="hero-headline">
              Trade smarter.<br/>
              <span className="text-primary-container">Start free.</span>
            </h1>
            
            {/* Stat Pills */}
            <div className="flex flex-wrap gap-[16px]">
              <div className={`glass-panel px-[24px] py-[16px] rounded-xl flex items-center gap-[8px] border-primary-container/20 border fade-up ${isMounted ? 'active' : ''}`} style={{ transitionDelay: '200ms' }}>
                <span className="material-symbols-outlined text-primary-container">bolt</span>
                <div>
                  <p className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider">Avg Response</p>
                  <p className="text-[20px] font-headline font-bold">14ms</p>
                </div>
              </div>
              <div className={`glass-panel px-[24px] py-[16px] rounded-xl flex items-center gap-[8px] border-primary-container/20 border fade-up ${isMounted ? 'active' : ''}`} style={{ transitionDelay: '280ms' }}>
                <span className="material-symbols-outlined text-primary-container">monitoring</span>
                <div>
                  <p className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider">Success Rate</p>
                  <p className="text-[20px] font-headline font-bold">92.4%</p>
                </div>
              </div>
              <div className={`glass-panel px-[24px] py-[16px] rounded-xl flex items-center gap-[8px] border-primary-container/20 border fade-up ${isMounted ? 'active' : ''}`} style={{ transitionDelay: '360ms' }}>
                <span className="material-symbols-outlined text-primary-container">shield</span>
                <div>
                  <p className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider">AI Security</p>
                  <p className="text-[20px] font-headline font-bold">Military</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-[64px] text-on-surface-variant text-[14px] opacity-60">
            © 2024 CryptoAI Trader. Institutional-grade precision for everyone.
          </div>
        </div>
      </section>

      {/* Right Panel: Sign-Up Form (45%) */}
      <section className="w-full md:w-[45%] h-full bg-surface flex flex-col items-center justify-center p-[24px] lg:p-[64px] z-20 overflow-y-auto">
        <div className={`w-full max-w-md fade-up ${isMounted ? 'active' : ''}`} style={{ transitionDelay: '100ms' }}>
          <div className="mb-[40px]">
            <h2 className="text-[32px] font-headline font-bold text-on-surface">Create your account</h2>
            <p className="text-on-surface-variant mt-[8px]">Join the future of algorithmic high-frequency trading.</p>
          </div>

          {/* Error Banner */}
          {(localError || error) && (
            <div className="bg-error-container text-on-error-container p-[16px] rounded-xl mb-[24px] overflow-hidden transition-all duration-200">
              <div className="flex items-center gap-[8px]">
                <span className="material-symbols-outlined">error</span>
                <p className="text-[14px] font-medium">{localError || error}</p>
              </div>
            </div>
          )}

          <form className="space-y-[16px]" onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div className={`space-y-[8px] ${shakeFields.fullName ? 'shake' : ''}`}>
              <label className="text-[12px] font-semibold text-on-surface-variant">FULL NAME</label>
              <div className="relative">
                <span className="absolute left-[16px] top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px]">person</span>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-[44px] pr-[16px] py-[16px] text-[14px] input-animated focus:ring-0 outline-none"
                  placeholder="John Doe"
                  required
                  type="text"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className={`space-y-[8px] ${shakeFields.email ? 'shake' : ''}`}>
              <label className="text-[12px] font-semibold text-on-surface-variant">EMAIL ADDRESS</label>
              <div className="relative">
                <span className="absolute left-[16px] top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px]">mail</span>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-[44px] pr-[16px] py-[16px] text-[14px] input-animated focus:ring-0 outline-none"
                  placeholder="name@company.com"
                  required
                  type="email"
                />
              </div>
            </div>

            {/* Password Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
              {/* Password */}
              <div className={`space-y-[8px] ${shakeFields.password ? 'shake' : ''}`}>
                <label className="text-[12px] font-semibold text-on-surface-variant">PASSWORD</label>
                <div className="relative">
                  <span className="absolute left-[16px] top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px]">lock</span>
                  <input
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-[44px] pr-[44px] py-[16px] text-[14px] input-animated focus:ring-0 outline-none"
                    placeholder="••••••••"
                    required
                    type={showPassword ? 'text' : 'password'}
                  />
                  <button
                    className="absolute right-[16px] top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors"
                    onClick={() => setShowPassword(prev => !prev)}
                    type="button"
                  >
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </button>
                </div>
                {/* Strength Meter */}
                <div className="h-1 rounded-full bg-surface-container-highest mt-[8px] overflow-hidden">
                  <div
                    className="strength-meter-fill h-full"
                    style={{
                      width: `${strength}%`,
                      backgroundColor: strengthBarColor
                    }}
                  ></div>
                </div>
              </div>

              {/* Confirm Password */}
              <div className={`space-y-[8px] ${shakeFields.confirmPassword ? 'shake' : ''}`}>
                <label className="text-[12px] font-semibold text-on-surface-variant">CONFIRM PASSWORD</label>
                <div className="relative">
                  <span className="absolute left-[16px] top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px]">lock_reset</span>
                  <input
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-[44px] pr-[44px] py-[16px] text-[14px] input-animated focus:ring-0 outline-none"
                    placeholder="••••••••"
                    required
                    type="password"
                  />
                  {form.confirmPassword && form.password === form.confirmPassword && (
                    <span className="absolute right-[16px] top-1/2 -translate-y-1/2 material-symbols-outlined text-[#00E676] scale-100 transition-transform duration-200">
                      check_circle
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* WhatsApp (Optional) */}
            <div className="space-y-[8px]">
              <label className="text-[12px] font-semibold text-on-surface-variant">WHATSAPP NUMBER (OPTIONAL)</label>
              <div className="flex gap-[8px]">
                <div className="w-24 shrink-0 relative" ref={dropdownRef}>
                  <button
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-[16px] py-[16px] text-[14px] flex items-center justify-between input-animated focus:ring-0 outline-none cursor-pointer"
                    onClick={() => setDropdownOpen(prev => !prev)}
                    type="button"
                  >
                    <span>{countryCode}</span>
                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                  </button>
                  {/* Country Dropdown */}
                  <div className={`absolute top-full left-0 right-0 mt-[8px] bg-surface-container-high border border-outline-variant rounded-xl overflow-hidden shadow-xl z-30 country-dropdown transition-all duration-200 ${dropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                    {['+1', '+44', '+91'].map((code) => (
                      <div
                        key={code}
                        className="p-[8px] hover:bg-surface-container-highest cursor-pointer text-center text-[14px]"
                        onClick={() => {
                          setCountryCode(code)
                          setDropdownOpen(false)
                        }}
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 relative">
                  <span className="absolute left-[16px] top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px]">phone_iphone</span>
                  <input
                    name="whatsappNumber"
                    value={form.whatsappNumber}
                    onChange={handleChange}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-[44px] pr-[16px] py-[16px] text-[14px] input-animated focus:ring-0 outline-none"
                    placeholder="555-0123"
                    type="tel"
                  />
                </div>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className={`flex items-start gap-[16px] pt-[4px] ${shakeFields.terms ? 'shake' : ''}`}>
              <div className="relative flex items-center mt-1">
                <input
                  id="terms"
                  name="agreeTerms"
                  checked={form.agreeTerms}
                  onChange={handleChange}
                  className="custom-checkbox"
                  required
                  type="checkbox"
                />
              </div>
              <label className="text-[14px] text-on-surface-variant leading-snug cursor-pointer" htmlFor="terms">
                I agree to the <a className="text-primary hover:underline transition-all" href="#terms-link">Terms of Service</a> and acknowledge the Risk Disclosure.
              </label>
            </div>

            {/* Submit */}
            <button
              className={`w-full text-on-primary py-[16px] rounded-xl font-bold text-[16px] flex items-center justify-center gap-[8px] mt-[24px] min-h-[56px] cursor-pointer transition-all duration-300 ${
                success
                  ? 'bg-[#00E676] shadow-[0_0_20px_rgba(0,230,118,0.4)] shimmer-btn-none'
                  : 'bg-gradient-to-r from-[#00C8FF] to-[#006684] shimmer-btn'
              }`}
              disabled={isLoading || success}
              type="submit"
            >
              <span>
                {success
                  ? 'Account created!'
                  : isLoading
                  ? 'Creating account...'
                  : 'CREATE ACCOUNT'}
              </span>
              <span className={`material-symbols-outlined text-[20px] ${isLoading && !success ? 'animate-spin' : ''}`}>
                {success ? 'check' : isLoading ? 'autorenew' : 'arrow_forward'}
              </span>
            </button>
          </form>

          {/* Footer */}
          <div className="mt-[40px] text-center">
            <p className="text-[14px] text-on-surface-variant">
              Already have an account? 
              <Link className="text-primary font-semibold hover:text-primary-container transition-colors ml-[8px]" to="/auth/login">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
