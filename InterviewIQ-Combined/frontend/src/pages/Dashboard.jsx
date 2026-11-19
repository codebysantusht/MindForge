
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import Banner from '../partials/Banner';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function getFeedbackObject(feedback) {
  if (!feedback) return null;

  if (typeof feedback === 'object') {
    return feedback;
  }

  if (typeof feedback === 'string') {
    try {
      return JSON.parse(feedback);
    } catch {
      return null;
    }
  }

  return null;
}

function getPercentage(rawValue, expectedMax) {
  if (rawValue === null || rawValue === undefined) {
    return null;
  }

  if (typeof rawValue === 'number') {
    if (!Number.isFinite(rawValue)) return null;

    return (rawValue / expectedMax) * 100;
  }

  const value = String(rawValue).trim();

  // Handles values such as "4/4", "2/2", and "3.5/4".
  const fractionMatch = value.match(
    /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/
  );

  if (fractionMatch) {
    const obtained = Number(fractionMatch[1]);
    const maximum = Number(fractionMatch[2]);

    if (!Number.isFinite(obtained) || maximum <= 0) {
      return null;
    }

    return (obtained / maximum) * 100;
  }

  // Handles numeric strings.
  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    return (numericValue / expectedMax) * 100;
  }

  return null;
}

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      const token = sessionStorage.getItem('interviewiq-token');

      if (!token) {
        throw new Error('Your session has expired. Please log in again.');
      }

      const requestOptions = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const [analyticsResponse, historyResponse] = await Promise.all([
        fetch(`${API_URL}/api/analytics`, requestOptions),
        fetch(`${API_URL}/api/history`, requestOptions),
      ]);

      if (!analyticsResponse.ok || !historyResponse.ok) {
        throw new Error('Unable to load dashboard data.');
      }

      const analyticsData = await analyticsResponse.json();
      const historyData = await historyResponse.json();

      setAnalytics(analyticsData);
      setInterviews(
        Array.isArray(historyData.interviews)
          ? historyData.interviews
          : []
      );
    } catch (err) {
      setError(err.message || 'Could not connect to the backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalInterviews = Number(analytics?.total_interviews || 0);
  const averageScore = Number(analytics?.average_score || 0);
  const bestScore = Number(analytics?.best_score || 0);

  // Calculate Focus Areas using the actual AI evaluation scores.
  const focusAreas = useMemo(() => {
    const dimensions = [
      {
        label: 'Technical Knowledge',
        key: 'technical_correctness',
        max: 4,
      },
      {
        label: 'Relevance',
        key: 'relevance',
        max: 2,
      },
      {
        label: 'Communication',
        key: 'clarity',
        max: 2,
      },
      {
        label: 'Completeness',
        key: 'completeness',
        max: 2,
      },
    ];

    if (!interviews.length) return [];

    return dimensions.map((dimension) => {
      let totalPercentage = 0;
      let count = 0;

      interviews.forEach((interview) => {
        const feedback = getFeedbackObject(interview.feedback);

        if (!feedback) return;

        const percentage = getPercentage(
          feedback[dimension.key],
          dimension.max
        );

        if (percentage !== null && Number.isFinite(percentage)) {
          totalPercentage += Math.max(0, Math.min(100, percentage));
          count += 1;
        }
      });

      return {
        label: dimension.label,
        value: count
          ? Math.round(totalPercentage / count)
          : null,
      };
    });
  }, [interviews]);

  const recentScores = useMemo(() => {
    return [...interviews]
      .sort(
        (a, b) =>
          new Date(b.created_at) - new Date(a.created_at)
      )
      .slice(0, 7)
      .reverse();
  }, [interviews]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date unavailable';

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return 'Date unavailable';
    }

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const stats = [
    {
      title: 'Total Interviews',
      value: totalInterviews,
      description: 'Completed interviews',
      icon: '🎯',
    },
    {
      title: 'Average Score',
      value: `${averageScore.toFixed(1)}/10`,
      description: 'Across all interviews',
      icon: '📈',
    },
    {
      title: 'Questions Practiced',
      value: totalInterviews,
      description: 'Evaluated questions',
      icon: '💬',
    },
    {
      title: 'Best Score',
      value: `${bestScore}/10`,
      description: 'Highest evaluation score',
      icon: '🏆',
    },
  ];

  const getScoreColor = (score) => {
    if (score >= 8) {
      return 'text-green-600 dark:text-green-400';
    }

    if (score >= 5) {
      return 'text-amber-600 dark:text-amber-400';
    }

    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

            {/* Page heading */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
                  Dashboard
                </h1>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Welcome back! Here's your interview preparation overview.
                </p>
              </div>

              <div className="flex gap-3 mt-4 sm:mt-0">
                <button
                  onClick={fetchDashboardData}
                  disabled={loading}
                  className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>

                <Link
                  to="/mock-interview"
                  className="inline-flex items-center justify-center px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition shadow-lg shadow-violet-500/20"
                >
                  <span className="mr-2 text-lg">+</span>
                  Start New Interview
                </Link>
              </div>
            </div>

            {error && (
              <div className="mb-6 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </div>
            )}

            {loading && !analytics ? (
              <div className="rounded-xl bg-white dark:bg-gray-800 p-12 text-center text-gray-500 dark:text-gray-400">
                Loading your dashboard...
              </div>
            ) : (
              <>
                {/* Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                  {stats.map((stat) => (
                    <div
                      key={stat.title}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/60 p-5 shadow-xs"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {stat.title}
                          </p>

                          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-3">
                            {stat.value}
                          </h2>
                        </div>

                        <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-500/10 text-xl">
                          {stat.icon}
                        </div>
                      </div>

                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                        {stat.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Main dashboard content */}
                <div className="grid grid-cols-12 gap-6 mb-8">

                  {/* Performance chart */}
                  <div className="col-span-12 xl:col-span-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/60 shadow-xs">
                    <div className="px-5 py-5 border-b border-gray-100 dark:border-gray-700/60">
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        Performance Overview
                      </h2>

                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Scores from your latest interview attempts
                      </p>
                    </div>

                    <div className="p-5">
                      {recentScores.length === 0 ? (
                        <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                          Complete your first interview to see your performance chart.
                        </div>
                      ) : (
                        <>
                          <div className="flex items-end justify-between mb-6">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Average Interview Score
                              </p>

                              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-1">
                                {averageScore.toFixed(1)}/10
                              </p>
                            </div>

                            <span className="text-xs text-gray-400">
                              Latest {recentScores.length} attempts
                            </span>
                          </div>

                          <div className="flex items-end justify-between gap-3 h-48">
                            {recentScores.map((item) => {
                              const score = Number(item.score || 0);

                              return (
                                <div
                                  key={item.id}
                                  className="flex flex-col items-center justify-end h-full flex-1 gap-3"
                                >
                                  <div className="w-full flex items-end justify-center h-full">
                                    <div
                                      className={`w-full max-w-12 rounded-t-md ${
                                        score >= 8
                                          ? 'bg-green-500'
                                          : score >= 5
                                            ? 'bg-violet-500'
                                            : 'bg-red-500'
                                      } hover:opacity-80 transition-all`}
                                      style={{
                                        height: `${Math.max(score * 10, 3)}%`,
                                      }}
                                      title={`Score: ${score}/10`}
                                    />
                                  </div>

                                  <span className="text-xs text-gray-400">
                                    #{item.id}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quick start */}
                  <div className="col-span-12 xl:col-span-4 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl p-6 shadow-lg shadow-violet-500/10 text-white flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center text-2xl mb-5">
                        🎤
                      </div>

                      <h2 className="text-xl font-bold">
                        Ready for your next interview?
                      </h2>

                      <p className="text-sm text-violet-100 mt-3 leading-relaxed">
                        Practice real-world interview questions and get AI-powered feedback to improve your performance.
                      </p>
                    </div>

                    <div className="mt-8">
                      <Link
                        to="/mock-interview"
                        className="inline-flex items-center justify-center w-full px-4 py-3 bg-white text-violet-700 hover:bg-violet-50 rounded-lg font-semibold text-sm transition"
                      >
                        Start Practicing
                        <span className="ml-2">→</span>
                      </Link>

                      <p className="text-xs text-violet-200 text-center mt-3">
                        Choose your role, level and interview type
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent interviews */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/60 shadow-xs mb-8">
                  <div className="px-5 py-5 flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        Recent Interviews
                      </h2>

                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Your latest practice sessions
                      </p>
                    </div>

                    <Link
                      to="/history"
                      className="text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
                    >
                      View all →
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="table-auto w-full">
                      <thead className="text-xs uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/30">
                        <tr>
                          <th className="px-5 py-3 text-left font-semibold">Role</th>
                          <th className="px-5 py-3 text-left font-semibold">Type</th>
                          <th className="px-5 py-3 text-left font-semibold">Date</th>
                          <th className="px-5 py-3 text-left font-semibold">Score</th>
                          <th className="px-5 py-3 text-left font-semibold">Status</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                        {interviews.slice(0, 5).map((interview) => (
                          <tr key={interview.id}>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                {interview.role}
                              </span>
                            </td>

                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {interview.interview_type}
                              </span>
                            </td>

                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(interview.created_at)}
                              </span>
                            </td>

                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className={`text-sm font-semibold ${getScoreColor(Number(interview.score))}`}>
                                {interview.score}/10
                              </span>
                            </td>

                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                                Completed
                              </span>
                            </td>
                          </tr>
                        ))}

                        {interviews.length === 0 && (
                          <tr>
                            <td
                              colSpan="5"
                              className="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                            >
                              No interviews completed yet. Start your first mock interview!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom section */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                  {/* Focus Areas */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/60 p-5 shadow-xs">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      Focus Areas
                    </h2>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-5">
                      Based on your actual AI evaluation scores
                    </p>

                    {focusAreas.length === 0 ? (
                      <p className="py-8 text-sm text-gray-500 dark:text-gray-400">
                        Complete an interview to see your skill breakdown.
                      </p>
                    ) : (
                      focusAreas.map((skill) => (
                        <div key={skill.label} className="mb-5 last:mb-0">
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {skill.label}
                            </span>

                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                              {skill.value === null
                                ? 'N/A'
                                : `${skill.value}%`}
                            </span>
                          </div>

                          <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-violet-500 rounded-full transition-all duration-500"
                              style={{
                                width: `${skill.value ?? 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Quick Tips */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/60 p-5 shadow-xs">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      Quick Tips
                    </h2>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-5">
                      Make every practice session count
                    </p>

                    <div className="space-y-4">
                      {[
                        {
                          icon: '💡',
                          title: 'Explain your thought process',
                          description: 'Talk through your approach instead of giving only the final answer.',
                        },
                        {
                          icon: '🎯',
                          title: 'Practice consistently',
                          description: 'Short, regular sessions can help build interview confidence.',
                        },
                        {
                          icon: '📚',
                          title: 'Review your feedback',
                          description: 'Focus on areas where your previous answers need improvement.',
                        },
                      ].map((tip) => (
                        <div key={tip.title} className="flex gap-3">
                          <div className="w-10 h-10 shrink-0 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-lg">
                            {tip.icon}
                          </div>

                          <div>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                              {tip.title}
                            </h3>

                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                              {tip.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>

        <Banner />
      </div>
    </div>
  );
}

export default Dashboard;
