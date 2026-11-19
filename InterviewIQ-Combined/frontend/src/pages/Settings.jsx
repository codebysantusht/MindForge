
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const DEFAULT_SETTINGS = {
  fullName: 'InterviewIQ User',
  email: '',
  targetRole: 'Cybersecurity Analyst',
  experienceLevel: 'Beginner',
  interviewType: 'Technical',
};

const STORAGE_KEY = 'interviewiq-settings';

function Settings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('interviewiq-token');

    if (!token) {
      navigate('/login');
      return null;
    }

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const headers = getAuthHeaders();

        if (!headers) return;

        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers,
        });

        if (response.status === 401) {
          sessionStorage.removeItem('interviewiq-token');
          sessionStorage.removeItem('interviewiq-user');
          navigate('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Unable to load your profile.');
        }

        const user = await response.json();

        const loadedSettings = {
          fullName: user.full_name || DEFAULT_SETTINGS.fullName,
          email: user.email || '',
          targetRole: user.target_role || DEFAULT_SETTINGS.targetRole,
          experienceLevel:
            user.experience_level || DEFAULT_SETTINGS.experienceLevel,
          interviewType:
            user.interview_type || DEFAULT_SETTINGS.interviewType,
        };

        setSettings(loadedSettings);

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(loadedSettings)
        );

        localStorage.setItem(
          'interviewiq-user',
          JSON.stringify(user)
        );
      } catch (error) {
        setMessage(error.message || 'Unable to load settings.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setSettings((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage('');
  };

  const saveSettings = async (updatedSettings) => {
    const headers = getAuthHeaders();

    if (!headers) return false;

    const response = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        full_name: updatedSettings.fullName,
        target_role: updatedSettings.targetRole,
        experience_level: updatedSettings.experienceLevel,
        interview_type: updatedSettings.interviewType,
      }),
    });

    if (response.status === 401) {
      localStorage.removeItem('interviewiq-token');
      localStorage.removeItem('interviewiq-user');
      navigate('/login');
      return false;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.detail || 'Unable to save your profile.');
    }

    const updatedUser = {
      ...data,
      full_name: updatedSettings.fullName,
      email: updatedSettings.email,
      target_role: updatedSettings.targetRole,
      experience_level: updatedSettings.experienceLevel,
      interview_type: updatedSettings.interviewType,
    };

    localStorage.setItem(
      'interviewiq-user',
      JSON.stringify(updatedUser)
    );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedSettings)
    );

    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const success = await saveSettings(settings);

      if (success) {
        setMessage('Your settings have been saved successfully.');
      }
    } catch (error) {
      setMessage(error.message || 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const resetSettings = {
      ...settings,
      targetRole: DEFAULT_SETTINGS.targetRole,
      experienceLevel: DEFAULT_SETTINGS.experienceLevel,
      interviewType: DEFAULT_SETTINGS.interviewType,
    };

    setSettings(resetSettings);
    setSaving(true);
    setMessage('');

    try {
      const success = await saveSettings(resetSettings);

      if (success) {
        setMessage('Interview preferences have been reset successfully.');
      }
    } catch (error) {
      setMessage(error.message || 'Unable to reset settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <main className="grow bg-gray-50 dark:bg-gray-900">
          <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Settings
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Manage your profile and interview preferences.
              </p>
            </div>

            {loading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                Loading your profile...
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">

                {/* Profile */}
                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                      Profile Information
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Update your basic profile details.
                    </p>
                  </div>

                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-2xl font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                      {settings.fullName.charAt(0).toUpperCase() || 'U'}
                    </div>

                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">
                        {settings.fullName || 'Your Name'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Interview Preparation Profile
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={settings.fullName}
                        onChange={handleChange}
                        required
                        disabled={saving}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={settings.email}
                        readOnly
                        className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-500 outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        Email address is linked to your account.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Interview preferences */}
                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                      Interview Preferences
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Choose your default settings for future mock interviews.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Preferred Target Role
                      </label>
                      <select
                        name="targetRole"
                        value={settings.targetRole}
                        onChange={handleChange}
                        disabled={saving}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      >
                        <option>Cybersecurity Analyst</option>
                        <option>SOC Analyst</option>
                        <option>Penetration Tester</option>
                        <option>Security Engineer</option>
                        <option>Software Engineer</option>
                        <option>Python Developer</option>
                        <option>Frontend Developer</option>
                        <option>Backend Developer</option>
                        <option>Full Stack Developer</option>
                        <option>Data Analyst</option>
                        <option>Machine Learning Engineer</option>
                        <option>Cloud Engineer</option>
                        <option>DevOps Engineer</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Default Experience Level
                        </label>
                        <select
                          name="experienceLevel"
                          value={settings.experienceLevel}
                          onChange={handleChange}
                          disabled={saving}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                          <option>Beginner</option>
                          <option>Intermediate</option>
                          <option>Advanced</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Default Interview Type
                        </label>
                        <select
                          name="interviewType"
                          value={settings.interviewType}
                          onChange={handleChange}
                          disabled={saving}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                          <option>Technical</option>
                          <option>HR</option>
                          <option>Mixed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Save controls */}
                <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                  <div>
                    {message && (
                      <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
                        {message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      Your preferences are saved to your account.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={saving}
                      className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Reset
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </section>

              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Settings;
