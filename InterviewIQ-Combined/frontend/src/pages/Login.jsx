
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const features = [
  {
    icon: '✦',
    title: 'AI-Powered Questions',
    description: 'Practice realistic, role-specific interview questions.',
  },
  {
    icon: '▥',
    title: 'Detailed Feedback',
    description: 'Get personalized insights to improve your answers.',
  },
  {
    icon: '◎',
    title: 'Multiple Career Roles',
    description: 'Prepare for technical and non-technical positions.',
  },
  {
    icon: '↗',
    title: 'Track Your Progress',
    description: 'Monitor your performance and interview growth.',
  },
];

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed. Please try again.');
      }

      sessionStorage.setItem('interviewiq-token', data.access_token);
      sessionStorage.setItem('interviewiq-user', JSON.stringify(data.user));

      localStorage.removeItem('interviewiq-token');
      localStorage.removeItem('interviewiq-user');

      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err.message || 'Unable to connect to the server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">

      {/* Left Branding Section */}
      <section className="relative flex min-h-[420px] flex-col justify-between overflow-hidden bg-[#0b1020] px-7 py-8 text-white sm:px-12 sm:py-10 lg:min-h-screen lg:px-16 lg:py-12">

        <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-violet-600/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-blue-600/20 blur-[100px]" />

        {/* Brand */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-xl font-bold shadow-lg shadow-violet-600/30">
              I
            </div>
            <span className="text-xl font-bold tracking-tight">
              InterviewIQ
            </span>
          </div>

          <span className="hidden text-sm text-gray-400 sm:block">
            Practice. Improve. Succeed.
          </span>
        </div>

        {/* Main Content */}
        <div className="relative z-10 my-12 max-w-xl lg:my-0">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-200">
            <span className="h-2 w-2 rounded-full bg-violet-400" />
            YOUR PERSONAL AI INTERVIEW COACH
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Ace Your
            <span className="mt-1 block bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Next Interview.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-gray-300 sm:text-lg">
            Build confidence, sharpen your answers and prepare for
            real-world interviews with AI-powered practice and
            personalized feedback.
          </p>

          {/* Features */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/15 text-xl text-violet-300">
                  {feature.icon}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Decorative Dashboard Preview */}
          <div className="mt-10 hidden max-w-md rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-sm sm:block">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">YOUR PERFORMANCE</p>
                <p className="mt-1 text-lg font-bold text-white">
                  Interview preparation
                </p>
              </div>
              <div className="rounded-lg bg-violet-500/20 px-3 py-2 text-xs font-semibold text-violet-300">
                AI Insights
              </div>
            </div>

            <div className="mt-5 flex items-end gap-2">
              {[35, 55, 42, 70, 60, 85, 100].map((height, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t-md bg-gradient-to-t from-violet-700 to-violet-400 opacity-90"
                  style={{ height: `${height * 0.45}px` }}
                />
              ))}
            </div>

            <p className="mt-3 text-xs text-gray-400">
              Practice consistently. Improve confidently.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-gray-500">
          <span>© {new Date().getFullYear()} InterviewIQ</span>
          <span>Built for your next big opportunity.</span>
        </div>
      </section>

      {/* Right Login Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fafaff] px-5 py-12 sm:px-10 lg:px-14">

        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-violet-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-blue-100/60 blur-3xl" />

        <div className="relative z-10 w-full max-w-md">

          {/* Login Heading */}
          <div className="mb-9 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-2xl font-bold text-white shadow-lg shadow-violet-600/25">
              I
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Sign in to continue your interview preparation.
            </p>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-7 shadow-xl shadow-gray-200/50 sm:p-9">

            <div className="mb-7">
              <h3 className="text-xl font-bold text-gray-900">
                Login to InterviewIQ
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Enter your account details below.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3.5 pr-20 text-sm text-gray-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-violet-600 hover:text-violet-800"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5 hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-medium text-gray-400">
                SECURE ACCESS
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="rounded-xl bg-violet-50/70 p-4 text-center">
              <p className="text-xs leading-5 text-violet-800">
                Your interview history and performance data are
                securely associated with your account.
              </p>
            </div>

            <div className="mt-7 border-t border-gray-100 pt-6 text-center">
              <p className="text-sm text-gray-500">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-violet-600 hover:text-violet-800"
                >
                  Create Account
                </Link>
              </p>
            </div>

          </div>

          <p className="mt-7 text-center text-xs text-gray-400">
            InterviewIQ — Practice. Improve. Succeed.
          </p>

        </div>
      </section>
    </div>
  );
}

export default Login;
