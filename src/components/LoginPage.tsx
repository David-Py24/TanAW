/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { AuthSession, saveSession } from '../utils/auth';

export interface LoginPageProps {
  onSignIn: (session: AuthSession) => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HIGHLIGHTS = [
  {
    icon: MapPin,
    title: 'Step-free routes',
    copy: 'Walking directions powered by Google Maps.',
  },
  {
    icon: ShieldCheck,
    title: 'Community verified',
    copy: 'Ramps, entrances, and restrooms checked by locals.',
  },
  {
    icon: Sparkles,
    title: 'AI storefront checks',
    copy: 'Scan a photo to spot barriers before you visit.',
  },
];

const MOBILE_CHIPS = ['Step-free routes', 'Community verified', 'AI checks'];

/**
 * Renders the dedicated phone layout below Tailwind's `lg` breakpoint and the
 * split desktop layout above it. Only one layout is mounted at a time so the
 * form keeps a single set of input IDs and full keyboard/screen-reader focus.
 */
function useCompactLayout(): boolean {
  const [isCompact, setIsCompact] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 1023px)').matches;
  });

  useEffect(() => {
    const query = window.matchMedia('(max-width: 1023px)');
    const handleChange = (event: MediaQueryListEvent) => setIsCompact(event.matches);

    setIsCompact(query.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  return isCompact;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSignIn }) => {
  const isCompact = useCompactLayout();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showResetHint, setShowResetHint] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const nextEmailError = EMAIL_PATTERN.test(trimmedEmail)
      ? ''
      : 'Enter a valid email address.';
    const nextPasswordError = password ? '' : 'Enter your password.';

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);

    if (nextEmailError) {
      emailRef.current?.focus();
      return;
    }
    if (nextPasswordError) {
      passwordRef.current?.focus();
      return;
    }

    const session: AuthSession = {
      email: trimmedEmail,
      signedInAt: new Date().toISOString(),
    };

    saveSession(session, remember);
    onSignIn(session);
  };

  const handleGuest = () => {
    const session: AuthSession = {
      email: 'guest@tanaw.app',
      guest: true,
      signedInAt: new Date().toISOString(),
    };

    // Guest access is intentionally tab-scoped so it ends when the tab closes.
    saveSession(session, false);
    onSignIn(session);
  };

  const inputShell = (hasError: boolean) =>
    `flex h-[52px] items-center gap-2.5 rounded-xl border bg-[#ffffff] px-3.5 shadow-2xs transition-all lg:h-11 ${
      hasError
        ? 'border-rose-300 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-100'
        : 'border-slate-300 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100'
    }`;

  const credentialsForm = (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label
          htmlFor="login-email"
          className="mb-1.5 block text-xs font-semibold text-slate-700"
        >
          Email
        </label>
        <div className={inputShell(Boolean(emailError))}>
          <Mail className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <input
            ref={emailRef}
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailError) setEmailError('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                passwordRef.current?.focus();
              }
            }}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? 'login-email-error' : undefined}
            className="h-full w-full min-w-0 border-0 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 lg:text-sm"
          />
        </div>
        {emailError && (
          <p
            id="login-email-error"
            role="alert"
            className="mt-1.5 text-[11px] font-medium text-rose-600"
          >
            {emailError}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="login-password"
          className="mb-1.5 block text-xs font-semibold text-slate-700"
        >
          Password
        </label>
        <div className={inputShell(Boolean(passwordError))}>
          <Lock className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <input
            ref={passwordRef}
            id="login-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            enterKeyHint="go"
            placeholder="Your password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (passwordError) setPasswordError('');
            }}
            aria-invalid={Boolean(passwordError)}
            aria-describedby={passwordError ? 'login-password-error' : undefined}
            className="h-full w-full min-w-0 border-0 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 lg:text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="-mr-2 grid h-11 w-11 shrink-0 touch-manipulation cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:h-9 lg:w-9"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {passwordError && (
          <p
            id="login-password-error"
            role="alert"
            className="mt-1.5 text-[11px] font-medium text-rose-600"
          >
            {passwordError}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="inline-flex min-h-12 cursor-pointer touch-manipulation items-center gap-2 py-1 text-xs font-medium text-slate-600 lg:min-h-11">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="peer sr-only"
          />
          <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border border-slate-300 bg-white text-transparent transition-colors peer-checked:border-teal-700 peer-checked:bg-teal-700 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-teal-300 peer-focus-visible:ring-offset-2">
            <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
          </span>
          Remember me
        </label>
        <button
          type="button"
          onClick={() => setShowResetHint((visible) => !visible)}
          className="inline-flex min-h-12 touch-manipulation cursor-pointer items-center px-1 py-1 text-xs font-semibold text-teal-800 underline decoration-teal-300 underline-offset-2 transition-colors hover:text-teal-950 hover:decoration-teal-700 lg:min-h-11"
        >
          Forgot password?
        </button>
      </div>

      {showResetHint && (
        <div
          role="status"
          className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-[11px] leading-relaxed text-teal-900"
        >
          Password reset isn&apos;t connected in this demo. Sign in with any valid
          email and any password you choose.
        </div>
      )}

      <button
        type="submit"
        className="group flex h-[52px] w-full touch-manipulation cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 focus-visible:outline-teal-700 lg:h-11"
      >
        Sign in
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </button>
    </form>
  );

  const alternateActions = (
    <>
      <div className="my-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 lg:my-5">
        <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
        or explore first
        <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
      </div>

      <button
        type="button"
        onClick={handleGuest}
        className="flex h-[52px] w-full touch-manipulation cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-4 text-sm font-semibold text-slate-700 shadow-2xs transition-colors hover:border-teal-300 hover:bg-teal-50/60 hover:text-teal-900 lg:h-11"
      >
        <Users className="h-4 w-4" aria-hidden="true" />
        Continue as guest
      </button>

      <p className="mt-4 px-1 text-center text-[11px] leading-relaxed text-slate-500 lg:mt-6">
        Demo sign-in · no credentials are sent anywhere. Your session stays in this
        browser.
      </p>
    </>
  );

  /* ---------------------------------------------------------------------- */
  /* Dedicated phone layout                                                 */
  /* ---------------------------------------------------------------------- */
  if (isCompact) {
    return (
      <div className="flex min-h-dvh flex-col bg-[#F5FAFD] font-space text-slate-900">
        <header
          className="login-mobile-hero relative shrink-0 overflow-hidden bg-slate-950 px-5 pb-11 text-white"
          style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.16) 1px, transparent 0)',
              backgroundSize: '22px 22px',
            }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-teal-700/40 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-teal-950/80 blur-2xl"
            aria-hidden="true"
          />
          <svg
            className="pointer-events-none absolute -bottom-6 -right-6 h-40 w-40 text-teal-400/10"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 22s8-7.1 8-13A8 8 0 0 0 4 9c0 5.9 8 13 8 13z" />
            <circle cx="12" cy="9" r="3" fill="#020617" />
          </svg>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5" aria-label="TanAW AccessMap">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-600 text-white shadow-sm">
                <svg
                  className="h-[18px] w-[18px] fill-none stroke-current stroke-[2] stroke-linecap-round stroke-linejoin-round"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
                  <circle cx="12" cy="9.5" r="2.5" />
                </svg>
              </div>
              <div>
                <div className="text-[15px] font-bold leading-none tracking-tight text-white">
                  TanAW<span className="text-teal-400">.</span>
                </div>
                <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  AccessMap
                </div>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-300">
              <MapPin className="h-3 w-3 text-teal-400" aria-hidden="true" />
              Mindanao
            </span>
          </div>

          <div className="login-mobile-copy relative z-10 mt-6 max-w-[19rem]">
            <h1 className="text-[1.85rem] font-semibold leading-[1.08] tracking-[-0.03em] text-white">
              Accessible places.
              <br />
              <span className="text-teal-300">Confident journeys.</span>
            </h1>
            <p className="mt-2.5 max-w-[17rem] text-[13px] leading-relaxed text-slate-400">
              Community-verified ramps, entrances, and step-free routes across
              Mindanao.
            </p>
          </div>

          <div className="login-mobile-chips relative z-10 mt-3.5 flex flex-wrap gap-1.5">
            {MOBILE_CHIPS.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-slate-300"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full bg-teal-400"
                  aria-hidden="true"
                />
                {label}
              </span>
            ))}
          </div>
        </header>

        <main
          className="login-mobile-sheet relative z-10 -mt-6 flex flex-1 flex-col rounded-t-[1.75rem] px-5 pt-5 shadow-[0_-18px_45px_-24px_rgba(2,6,23,0.65)]"
          style={{
            backgroundColor: '#F5FAFD',
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #D5E5EC 1.2px, transparent 0)',
            backgroundSize: '32px 32px',
            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
          }}
        >
          <div className="mx-auto w-full max-w-sm">
            <div
              className="login-mobile-handle mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200"
              aria-hidden="true"
            />
            <h2 className="text-[1.4rem] font-semibold tracking-[-0.02em] text-slate-900">
              Welcome back
            </h2>
            <p className="mt-1 text-[13px] text-slate-500">
              Sign in to continue mapping accessibility.
            </p>
            <div className="mt-5">{credentialsForm}</div>
            {alternateActions}
          </div>
        </main>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Desktop / tablet landscape layout                                      */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="grid min-h-screen w-full grid-cols-[1.05fr_0.95fr] bg-[#F5FAFD] font-space text-slate-900">
      <main
        className="relative flex min-h-screen flex-col overflow-hidden"
        style={{
          backgroundColor: '#F5FAFD',
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #D5E5EC 1.2px, transparent 0)',
          backgroundSize: '36px 36px',
        }}
      >
        <div
          className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl"
          aria-hidden="true"
        />

        <header className="relative z-10 flex items-center justify-between px-10 pt-8">
          <div className="flex items-center gap-2.5" aria-label="TanAW AccessMap">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-700 text-white shadow-sm">
              <svg
                className="h-5 w-5 fill-none stroke-current stroke-[2] stroke-linecap-round stroke-linejoin-round"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
                <circle cx="12" cy="9.5" r="2.5" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-bold leading-none tracking-tight text-slate-900">
                TanAW<span className="text-teal-600">.</span>
              </div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                AccessMap
              </div>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
            <MapPin className="h-3 w-3 text-teal-600" />
            Mindanao, Philippines
          </span>
        </header>

        <div className="relative z-10 flex flex-1 items-center justify-center px-10 py-10">
          <div className="w-full max-w-[400px]">
            <div className="mb-7">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-800">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" aria-hidden="true" />
                Community access
              </span>
              <h1 className="mt-4 text-[2.35rem] font-semibold leading-tight tracking-[-0.03em] text-slate-900">
                Welcome back
              </h1>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                Sign in to keep mapping step-free places and verified accessibility
                features across Mindanao.
              </p>
            </div>

            {credentialsForm}
            {alternateActions}
          </div>
        </div>
      </main>

      {/* Informational panel */}
      <aside
        className="relative hidden overflow-hidden bg-slate-950 p-10 lg:flex lg:flex-col lg:justify-between xl:p-14"
        aria-label="About TanAW AccessMap"
      >
        <div
          className="pointer-events-none absolute -right-32 -top-40 h-[26rem] w-[26rem] rounded-full bg-teal-800/30 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-44 -left-32 h-[28rem] w-[28rem] rounded-full bg-teal-950/60 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-teal-800/40"
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300/90">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Community-verified accessibility
        </div>

        <div className="relative z-10 max-w-md">
          <div className="mb-8 overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/80 p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Live accessibility map
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                Community verified
              </span>
            </div>

            <div className="relative mt-3 h-40 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 1px 1px, rgba(45, 212, 191, 0.14) 1px, transparent 0)',
                  backgroundSize: '18px 18px',
                }}
                aria-hidden="true"
              />
              <svg
                viewBox="0 0 320 180"
                className="absolute inset-0 h-full w-full"
                fill="none"
                aria-hidden="true"
              >
                <g stroke="#1e293b" strokeWidth="1.5">
                  <path d="M-20 44 H340" />
                  <path d="M-20 126 H340" />
                  <path d="M78 -20 V200" />
                  <path d="M218 -20 V200" />
                  <path d="M-20 86 C 60 66, 150 106, 340 76" />
                </g>
                <path
                  d="M46 144 C 90 112, 120 122, 160 96 S 234 46, 276 56"
                  stroke="#2dd4bf"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="7 7"
                />
              </svg>

              <span
                className="absolute left-[14%] top-[72%] grid h-5 w-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-slate-950 bg-teal-500 text-slate-950 shadow"
                aria-hidden="true"
              >
                <MapPin className="h-3 w-3" />
              </span>
              <span
                className="absolute left-[50%] top-[53%] grid h-5 w-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-slate-950 bg-sky-400 text-slate-950 shadow"
                aria-hidden="true"
              >
                <MapPin className="h-3 w-3" />
              </span>
              <span
                className="absolute left-[85%] top-[31%] grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-slate-950 bg-emerald-400 text-slate-950 shadow"
                aria-hidden="true"
              >
                <MapPin className="h-3.5 w-3.5" />
              </span>

              <span className="absolute bottom-2.5 left-2.5 rounded-lg border border-slate-700/80 bg-slate-900/95 px-2 py-1 text-[10px] font-semibold text-slate-300">
                ♿ Step-free route · 8 min
              </span>
            </div>

            <div className="mt-3.5 flex items-center gap-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-teal-500/30 bg-teal-500/15 text-teal-300">
                <Check className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-white">
                  Ramps, entrances, and restroom checks
                </p>
                <p className="truncate text-[10px] text-slate-500">
                  Reported by mappers across Mindanao
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-[2.15rem] font-semibold leading-tight tracking-[-0.03em] text-white">
            Know a place is accessible before you go.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            One shared map for step-free routes, verified venues, and real
            experiences from the community.
          </p>

          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, title, copy }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-700/80 bg-slate-900/80 text-teal-300">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-xs font-semibold text-slate-100">
                    {title}
                  </span>
                  <span className="block text-[11px] leading-relaxed text-slate-500">
                    {copy}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-[11px] text-slate-500">
          TanAW · AccessMap — Northern Mindanao, Philippines
        </p>
      </aside>
    </div>
  );
};
