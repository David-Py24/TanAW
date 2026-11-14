/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AuthUser,
  registerAccount,
  signInAccount,
  setCurrentUserSession,
} from '../utils/storage';
import { MapPin, Eye, EyeOff, ShieldCheck, Check } from 'lucide-react';

interface AuthGatePageProps {
  onAuthenticated: (user: AuthUser) => void;
}

export const AuthGatePage: React.FC<AuthGatePageProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<AuthUser['role']>('PWD Member / Advocate');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Password strength (0 to 4) for signup
  const passwordStrength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password) && password.length >= 8) s++;
    return Math.max(1, s);
  })();
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = [
    'bg-[#D5E5EC]',
    'bg-rose-500',
    'bg-amber-500',
    'bg-lime-500',
    'bg-[#21524B]',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!validEmail) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setErrorMsg('Please enter your full name so your contributions are verified.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Please use at least 6 characters for your password.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      if (!agreedTerms) {
        setErrorMsg('Please agree to the community anti-trolling pledge to continue.');
        return;
      }

      const res = registerAccount(name, email, password, role);
      if (res.error) {
        setErrorMsg(res.error);
        return;
      }
      if (res.user) {
        onAuthenticated(res.user);
      }
    } else {
      if (!password) {
        setErrorMsg('Please enter your password.');
        return;
      }
      const res = signInAccount(email, password);
      if (res.error) {
        setErrorMsg(res.error);
        return;
      }
      if (res.user) {
        onAuthenticated(res.user);
      }
    }
  };

  const handleGoogleContinue = () => {
    // Ready for Firebase signInWithPopup(auth, googleProvider)
    const googleUser: AuthUser = {
      id: `google-${Date.now()}`,
      name: name.trim() || email.split('@')[0] || 'Verified Mapper',
      email: email.trim() || 'mapper@tanaw.ph',
      role,
      createdAt: new Date().toISOString(),
    };
    setCurrentUserSession(googleUser);
    onAuthenticated(googleUser);
  };

  return (
    <div className="min-h-dvh w-screen grid grid-cols-1 lg:grid-cols-2 bg-[#F5FAFD] text-[#0F172A] font-sans select-none overflow-x-hidden">
      {/* Left Column: Auth Form */}
      <main
        className="flex flex-col justify-between p-6 sm:p-10 overflow-y-auto"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #D5E5EC 1.2px, transparent 0)',
          backgroundSize: '36px 36px',
        }}
      >
        {/* Top Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-extrabold text-xl tracking-tight text-[#0F172A]">
            <div className="w-9 h-9 rounded-xl bg-[#21524B] text-white grid place-items-center border-2 border-[#0F172A] shadow-[0_2px_0_#0F172A]">
              <MapPin className="w-4 h-4" />
            </div>
            <span>
              TanAW<span className="text-[#21524B]">.</span>
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E2F0EC] border border-[#21524B] text-[11px] font-bold text-[#133732]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#21524B]" />
            Verified PWD Community
          </span>
        </div>

        {/* Center Auth Box */}
        <div className="w-full max-w-[400px] mx-auto my-8">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 p-1 mb-6 rounded-full bg-white border-2 border-[#0F172A] shadow-[0_2px_0_#0F172A]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-[#21524B] text-white'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#21524B] text-white'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              Create Account
            </button>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A] leading-tight">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-[#475569] mt-1.5 mb-6">
            {mode === 'signin'
              ? 'Sign in to view accessible places, verify ramps, and keep community data trustworthy.'
              : 'To protect PWD mappers from fake reports or trolling, every contributor signs in before pinning places.'}
          </p>

          {/* Continue with Google */}
          <button
            type="button"
            onClick={handleGoogleContinue}
            className="w-full h-12 px-5 rounded-full bg-white hover:bg-[#EAF3F7] border-2 border-[#0F172A] shadow-[0_3px_0_#0F172A] hover:-translate-y-0.5 active:translate-y-0 transition-all font-bold text-sm flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.6a4.8 4.8 0 01-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.6z"
              />
              <path
                fill="#34A853"
                d="M12 22c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.7v2.7A10 10 0 0012 22z"
              />
              <path
                fill="#FBBC05"
                d="M6.2 13.6a6 6 0 010-3.8V7.1H2.7a10 10 0 000 9.2z"
              />
              <path
                fill="#EA4335"
                d="M12 6c1.5 0 2.9.5 4 1.6l3-3A10 10 0 002.7 7.1l3.5 2.7C7 7.8 9.3 6 12 6z"
              />
            </svg>
            <span>{mode === 'signin' ? 'Continue with Google' : 'Sign up with Google'}</span>
          </button>

          <div className="flex items-center gap-3.5 text-xs font-semibold text-[#475569] my-5">
            <span className="flex-1 h-[1.5px] bg-[#D5E5EC]" />
            <span>or with email</span>
            <span className="flex-1 h-[1.5px] bg-[#D5E5EC]" />
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="mb-4 px-4 py-2.5 rounded-2xl bg-rose-50 border-2 border-rose-700 text-xs font-bold text-rose-800"
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            {mode === 'signup' && (
              <>
                <div>
                  <label htmlFor="auth-name" className="block text-xs font-bold mb-1 ml-1">
                    Full name
                  </label>
                  <div className="h-12 bg-white focus-within:bg-[#E2F0EC] border-2 border-[#0F172A] rounded-full shadow-[0_2px_0_#0F172A] flex items-center px-5 transition-colors">
                    <input
                      id="auth-name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Juan Dela Cruz"
                      className="w-full bg-transparent text-sm font-medium text-[#0F172A] placeholder:text-[#475569]/70 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="auth-role" className="block text-xs font-bold mb-1 ml-1">
                    I am joining as a
                  </label>
                  <div className="h-12 bg-white focus-within:bg-[#E2F0EC] border-2 border-[#0F172A] rounded-full shadow-[0_2px_0_#0F172A] flex items-center px-5 transition-colors">
                    <select
                      id="auth-role"
                      value={role}
                      onChange={(e) => setRole(e.target.value as AuthUser['role'])}
                      className="w-full bg-transparent text-sm font-semibold text-[#0F172A] focus:outline-none cursor-pointer"
                    >
                      <option value="PWD Member / Advocate">PWD Member / Advocate</option>
                      <option value="Caregiver / Family">Caregiver / Family Member</option>
                      <option value="Community Mapper">Community Accessibility Mapper</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-bold mb-1 ml-1">
                Email
              </label>
              <div className="h-12 bg-white focus-within:bg-[#E2F0EC] border-2 border-[#0F172A] rounded-full shadow-[0_2px_0_#0F172A] flex items-center px-5 transition-colors">
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent text-sm font-medium text-[#0F172A] placeholder:text-[#475569]/70 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-pw" className="block text-xs font-bold mb-1 ml-1">
                Password
              </label>
              <div className="h-12 bg-white focus-within:bg-[#E2F0EC] border-2 border-[#0F172A] rounded-full shadow-[0_2px_0_#0F172A] flex items-center pl-5 pr-2 transition-colors">
                <input
                  id="auth-pw"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signin' ? 'Your password' : 'At least 6 characters'}
                  className="w-full bg-transparent text-sm font-medium text-[#0F172A] placeholder:text-[#475569]/70 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="w-10 h-10 rounded-full grid place-items-center text-[#0F172A] hover:bg-black/5 cursor-pointer shrink-0"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <>
                {/* Password Strength Meter */}
                <div className="flex items-center gap-1.5 px-1 pt-0.5" aria-hidden="true">
                  {[1, 2, 3, 4].map((idx) => (
                    <span
                      key={idx}
                      className={`flex-1 h-1.5 rounded-full transition-colors ${
                        passwordStrength >= idx ? strengthColors[passwordStrength] : 'bg-[#D5E5EC]'
                      }`}
                    />
                  ))}
                  <span className="text-[11px] font-semibold text-[#475569] min-w-[46px] text-right">
                    {strengthLabels[passwordStrength]}
                  </span>
                </div>

                <div>
                  <label htmlFor="auth-pw2" className="block text-xs font-bold mb-1 ml-1">
                    Confirm password
                  </label>
                  <div className="h-12 bg-white focus-within:bg-[#E2F0EC] border-2 border-[#0F172A] rounded-full shadow-[0_2px_0_#0F172A] flex items-center px-5 transition-colors">
                    <input
                      id="auth-pw2"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full bg-transparent text-sm font-medium text-[#0F172A] placeholder:text-[#475569]/70 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Anti-Trolling Community Pledge Checkbox */}
                <label className="flex items-start gap-2.5 pt-1 px-1 text-xs text-[#475569] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="sr-only"
                  />
                  <span
                    className={`w-5 h-5 mt-0.5 rounded-md border-2 border-[#0F172A] grid place-items-center shrink-0 transition-colors ${
                      agreedTerms ? 'bg-[#21524B] text-white' : 'bg-white'
                    }`}
                  >
                    {agreedTerms && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </span>
                  <span className="leading-snug">
                    I pledge to submit honest accessibility reports for the PWD community and understand fake pins will be removed.
                  </span>
                </label>
              </>
            )}

            <button
              type="submit"
              className="w-full h-12 mt-2 rounded-full bg-[#21524B] hover:bg-[#2B685F] text-white font-bold text-sm border-2 border-[#0F172A] shadow-[0_3px_0_#0F172A] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              {mode === 'signin' ? 'Sign in to TanAW' : 'Create verified account'}
            </button>
          </form>

          <p className="text-center text-xs sm:text-sm text-[#475569] mt-5">
            {mode === 'signin' ? (
              <>
                Need an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                  }}
                  className="font-bold text-[#0F172A] border-b-2 border-[#0F172A] hover:text-[#21524B] cursor-pointer"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                  }}
                  className="font-bold text-[#0F172A] border-b-2 border-[#0F172A] hover:text-[#21524B] cursor-pointer"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        {/* Bottom Caption */}
        <p className="text-center text-[11px] text-[#475569]">
          Built for Cagayan de Oro &amp; Mindanao PWD navigation • Protected by community verification
        </p>
      </main>

      {/* Right Column: Visual Accessibility Showcase */}
      <aside
        aria-label="TanAW preview"
        className="hidden lg:flex relative bg-[#0F172A] overflow-hidden flex-col items-center justify-center p-10"
      >
        <span className="absolute w-[420px] h-[420px] -right-28 -top-40 rounded-full bg-[#21524B]/35 pointer-events-none" />
        <span className="absolute w-[480px] h-[480px] -left-32 -bottom-44 rounded-full bg-[#133732]/55 pointer-events-none" />
        <span className="absolute w-[540px] h-[540px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#21524B]/40 pointer-events-none" />

        {mode === 'signin' ? (
          <div className="relative z-10 w-[300px] bg-white border-2 border-white rounded-[22px] shadow-[0_4px_0_#21524B] -rotate-2 hover:rotate-0 transition-transform overflow-hidden">
            <div className="h-24 bg-[#0B132B] border-b-2 border-[#0F172A] relative" />
            <div className="w-[72px] h-[72px] rounded-full bg-[#E2F0EC] border-2 border-[#0F172A] grid place-items-center font-extrabold text-xl text-[#133732] mx-auto -mt-9 relative z-10">
              CM
            </div>
            <div className="p-5 pt-3 text-center text-[#0F172A]">
              <b className="block text-lg font-bold">Centrio Mall</b>
              <small className="block text-xs text-[#475569] mb-3.5">
                Main entrance · 92% accessible
              </small>
              <div className="space-y-2">
                <div className="h-8 rounded-full bg-[#0B132B] text-white text-xs font-medium flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#38A394]" />
                  <span>Step-free entry</span>
                </div>
                <div className="h-8 rounded-full bg-[#0B132B] text-white text-xs font-medium flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#38A394]" />
                  <span>Automatic door</span>
                </div>
                <div className="h-8 rounded-full bg-[#0B132B] text-white text-xs font-medium flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#38A394]" />
                  <span>Elevator to all floors</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 w-[300px] bg-white border-2 border-white rounded-[22px] shadow-[0_4px_0_#21524B] rotate-2 hover:rotate-0 transition-transform p-5 text-[#0F172A]">
            <div className="flex items-center justify-between text-xs text-[#475569] border-b border-[#D5E5EC] pb-2.5 mb-3.5">
              <span>Verified mappers</span>
              <span className="px-2 py-0.5 rounded-full bg-[#E2F0EC] text-[#133732] font-bold text-[11px] border border-[#21524B]">
                Anti-Troll Protected
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <b className="text-4xl font-bold tracking-tight">37+</b>
              <span className="text-xs text-[#475569]">CDO &amp; Mindanao places</span>
            </div>
            <div className="flex items-end gap-1.5 h-16 my-4">
              <span className="flex-1 h-[35%] rounded bg-[#E2F0EC] border border-[#0F172A]" />
              <span className="flex-1 h-[50%] rounded bg-[#E2F0EC] border border-[#0F172A]" />
              <span className="flex-1 h-[45%] rounded bg-[#E2F0EC] border border-[#0F172A]" />
              <span className="flex-1 h-[70%] rounded bg-[#E2F0EC] border border-[#0F172A]" />
              <span className="flex-1 h-[85%] rounded bg-[#E2F0EC] border border-[#0F172A]" />
              <span className="flex-1 h-full rounded bg-[#21524B] border border-[#0F172A]" />
            </div>
            <div className="space-y-2">
              <div className="h-8 rounded-full bg-[#0B132B] text-white text-xs font-medium flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#38A394]" />
                <span>Verified by real people</span>
              </div>
              <div className="h-8 rounded-full bg-[#0B132B] text-white text-xs font-medium flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#38A394]" />
                <span>Account-linked pins &amp; votes</span>
              </div>
            </div>
          </div>
        )}

        <div className="relative z-10 text-center text-white mt-8 max-w-sm">
          <h2 className="text-2xl font-bold tracking-tight">
            {mode === 'signin'
              ? 'Know a place is accessible before you go'
              : 'Every pin you add helps someone get around'}
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            {mode === 'signin'
              ? 'Check ramps, doors, and elevators from real community reports.'
              : 'Account verification keeps our accessibility map accurate and troll-free for PWDs.'}
          </p>
        </div>
      </aside>
    </div>
  );
};

