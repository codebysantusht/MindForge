
import { useEffect, useState } from 'react';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function Analytics() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');

    try {
      const token = sessionStorage.getItem('interviewiq-token');

      const response = await fetch(`${API_URL}/api/analytics`, {
         headers: {
         Authorization: `Bearer ${token}`,
      },
});

      if (!response.ok) {
        throw new Error('Unable to load performance analytics.');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err.message || 'Could not connect to the backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const scoreDistribution = analytics?.score_distribution || [];
  const recentScores = analytics?.recent_scores || [];

  const averageScore = Number(analytics?.average_score || 0);
  const bestScore = Number(analytics?.best_score || 0);
  const totalInterviews = Number(analytics?.total_interviews || 0);

  const getScoreColor = (score) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 5) return 'bg-amber-500';
    return 'bg-red-500';
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
          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Performance Analytics
                </h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Track your interview performance and identify areas for improvement.
                </p>
              </div>

              <button
                onClick={fetchAnalytics}
                disabled={loading}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              >
                {loading ? 'Refreshing...' : 'Refresh Analytics'}
              </button>
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </div>
            )}

            {loading && !analytics ? (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                Loading your performance data...
              </div>
            ) : (
              <>
                {/* Performance summary cards */}
                <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Total Interviews
                    </p>
                    <p className="mt-3 text-3xl font-bold text-gray-800 dark:text-white">
                      {totalInterviews}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      Completed interviews
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Average Score
                    </p>
                    <p className="mt-3 text-3xl font-bold text-violet-600 dark:text-violet-400">
                      {averageScore.toFixed(1)}
                      <span className="text-base text-gray-400">/10</span>
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      Across all interviews
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Best Score
                    </p>
                    <p className="mt-3 text-3xl font-bold text-green-600 dark:text-green-400">
                      {bestScore}
                      <span className="text-base text-gray-400">/10</span>
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      Highest evaluation score
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Performance Level
                    </p>
                    <p className="mt-3 text-2xl font-bold text-gray-800 dark:text-white">
                      {totalInterviews === 0
                        ? 'No Data'
                        : averageScore >= 8
                          ? 'Excellent'
                          : averageScore >= 6
                            ? 'Good'
                            : averageScore >= 4
                              ? 'Average'
                              : 'Needs Practice'}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      Based on average score
                    </p>
                  </div>

                </div>

                <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

                  {/* Score distribution */}
                  <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                      Score Distribution
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Number of interviews at each achieved score
                    </p>

                    {scoreDistribution.length === 0 ? (
                      <div className="py-12 text-center text-sm text-gray-500">
                        No score data available yet.
                      </div>
                    ) : (
                      <div className="mt-8 space-y-5">
                        {scoreDistribution.map((item) => (
                          <div key={item.score}>
                            <div className="mb-2 flex items-center justify-between text-sm">
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {item.score}/10
                              </span>
                              <span className="text-gray-500 dark:text-gray-400">
                                {item.count} interview(s)
                              </span>
                            </div>

                            <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                              <div
                                className={`h-full rounded-full ${getScoreColor(Number(item.score))}`}
                                style={{
                                  width: `${Math.min(
                                    (Number(item.count) / totalInterviews) * 100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Performance overview */}
                  <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                      Performance Overview
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Your overall score against the 10-point scale
                    </p>

                    <div className="mt-8">
                      <div className="mb-3 flex items-end justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Average Performance
                        </span>
                        <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                          {averageScore.toFixed(1)}/10
                        </span>
                      </div>

                      <div className="h-4 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                        <div
                          className="h-full rounded-full bg-violet-500 transition-all"
                          style={{
                            width: `${Math.min(averageScore * 10, 100)}%`,
                          }}
                        />
                      </div>

                      <div className="mt-2 flex justify-between text-xs text-gray-400">
                        <span>0</span>
                        <span>5</span>
                        <span>10</span>
                      </div>
                    </div>

                    <div className="mt-10 rounded-lg bg-violet-50 p-5 dark:bg-violet-500/10">
                      <p className="text-sm font-semibold text-violet-800 dark:text-violet-300">
                        Performance Insight
                      </p>
                      <p className="mt-2 text-sm leading-6 text-violet-700 dark:text-violet-200">
                        {totalInterviews === 0
                          ? 'Complete your first mock interview to start tracking your progress.'
                          : averageScore >= 8
                            ? 'Excellent performance! Keep practising to maintain your consistency.'
                            : averageScore >= 6
                              ? 'Good progress! Focus on improving technical depth and answer completeness.'
                              : 'Keep practising. Review your AI feedback and work on the suggested improvements.'}
                      </p>
                    </div>
                  </section>
                </div>

                {/* Recent interview scores */}
                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-700">
                    <h2 className="font-semibold text-gray-800 dark:text-white">
                      Recent Interview Performance
                    </h2>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Your latest 10 recorded interviews
                    </p>
                  </div>

                  {recentScores.length === 0 ? (
                    <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400">
                      No completed interviews available.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                          <tr>
                            <th className="px-6 py-4 font-medium">Interview ID</th>
                            <th className="px-6 py-4 font-medium">Role</th>
                            <th className="px-6 py-4 font-medium">Date</th>
                            <th className="px-6 py-4 font-medium">Score</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {recentScores.map((item) => (
                            <tr key={item.id}>
                              <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                #{item.id}
                              </td>
                              <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-100">
                                {item.role}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-gray-500 dark:text-gray-400">
                                {new Date(item.created_at).toLocaleDateString('en-IN')}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getScoreColor(Number(item.score))} text-white`}>
                                  {item.score ?? 'N/A'}/10
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

export default Analytics;
