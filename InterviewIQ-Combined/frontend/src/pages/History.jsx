
import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function History() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [interviews, setInterviews] = useState([]);
  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const token = sessionStorage.getItem('interviewiq-token');

      const response = await fetch(`${API_URL}/api/history`, {
          headers: {
          Authorization: `Bearer ${token}`,
        },
     });

      if (!response.ok) {
        throw new Error('Unable to fetch interview history.');
      }

      const data = await response.json();
      setInterviews(data.interviews || []);
    } catch (err) {
      setError(err.message || 'Could not connect to the backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredInterviews = useMemo(() => {
    return interviews.filter((interview) => {
      const matchesSearch =
        interview.role?.toLowerCase().includes(search.toLowerCase()) ||
        interview.question?.toLowerCase().includes(search.toLowerCase());

      const score = Number(interview.score);

      const matchesScore =
        scoreFilter === 'all' ||
        (scoreFilter === 'high' && score >= 8) ||
        (scoreFilter === 'medium' && score >= 5 && score < 8) ||
        (scoreFilter === 'low' && score < 5);

      return matchesSearch && matchesScore;
    });
  }, [interviews, search, scoreFilter]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date unavailable';

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return 'Date unavailable';

    return date.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getScoreStyle = (score) => {
    if (score >= 8) {
      return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
    }

    if (score >= 5) {
      return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
    }

    return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';
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
                  Interview History
                </h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Review your previous interviews and AI evaluation results.
                </p>
              </div>

              <button
                onClick={fetchHistory}
                disabled={loading}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                {loading ? 'Refreshing...' : 'Refresh History'}
              </button>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Interviews
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white">
                  {interviews.length}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Average Score
                </p>
                <p className="mt-2 text-3xl font-bold text-violet-600 dark:text-violet-400">
                  {interviews.length
                    ? (
                        interviews.reduce(
                          (total, item) => total + Number(item.score || 0),
                          0
                        ) / interviews.length
                      ).toFixed(1)
                    : '0.0'}
                  <span className="text-base font-medium text-gray-400">/10</span>
                </p>
              </div>
            </div>

            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by role or question..."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />

              <select
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Scores</option>
                <option value="high">High (8–10)</option>
                <option value="medium">Medium (5–7.9)</option>
                <option value="low">Low (Below 5)</option>
              </select>
            </div>

            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">

              <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-700">
                <h2 className="font-semibold text-gray-800 dark:text-white">
                  Previous Attempts
                </h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {filteredInterviews.length} interview(s) found
                </p>
              </div>

              {loading ? (
                <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  Loading interview history...
                </div>
              ) : filteredInterviews.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mb-3 text-3xl">📋</div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">
                    No interviews found
                  </p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Complete a mock interview to see your history here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                      <tr>
                        <th className="px-6 py-4 font-medium">Role</th>
                        <th className="px-6 py-4 font-medium">Level</th>
                        <th className="px-6 py-4 font-medium">Type</th>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Score</th>
                        <th className="px-6 py-4 font-medium">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredInterviews.map((interview) => (
                        <tr
                          key={interview.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                        >
                          <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-100">
                            {interview.role}
                          </td>

                          <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                            {interview.level}
                          </td>

                          <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                            {interview.interview_type}
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-gray-500 dark:text-gray-400">
                            {formatDate(interview.created_at)}
                          </td>

                          <td className="px-6 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getScoreStyle(Number(interview.score))}`}>
                              {interview.score ?? 'N/A'}/10
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedInterview(interview)}
                              className="font-medium text-violet-600 hover:text-violet-800 dark:text-violet-400"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {selectedInterview && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">

                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        Interview Details
                      </h2>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Interview #{selectedInterview.id}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedInterview(null)}
                      className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mb-5 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Role</p>
                      <p className="mt-1 font-semibold text-gray-800 dark:text-white">
                        {selectedInterview.role}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Score</p>
                      <p className="mt-1 text-xl font-bold text-violet-600 dark:text-violet-400">
                        {selectedInterview.score ?? 'N/A'}/10
                      </p>
                    </div>
                  </div>

                  <div className="mb-5">
                    <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">
                      Interview Question
                    </h3>
                    <p className="rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300">
                      {selectedInterview.question}
                    </p>
                  </div>

                  <div className="mb-5">
                    <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">
                      Your Answer
                    </h3>
                    <p className="rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300">
                      {selectedInterview.answer}
                    </p>
                  </div>

                  <div className="mb-5">
                    <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">
                      AI Summary
                    </h3>
                    <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                      {selectedInterview.feedback?.summary || 'No summary available.'}
                    </p>
                  </div>

                  <div className="mb-5 grid grid-cols-2 gap-3">
                    {[
                      ['Technical Correctness', selectedInterview.feedback?.technical_correctness],
                      ['Relevance', selectedInterview.feedback?.relevance],
                      ['Clarity', selectedInterview.feedback?.clarity],
                      ['Completeness', selectedInterview.feedback?.completeness],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                        <p className="mt-1 font-semibold text-gray-800 dark:text-white">
                          {value ?? '—'}
                        </p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setSelectedInterview(null)}
                    className="w-full rounded-lg bg-violet-600 px-4 py-3 text-sm font-medium text-white hover:bg-violet-700"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

export default History;
