
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Transition from '../utils/Transition';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function getFeedback(feedback) {
  if (!feedback) return {};

  if (typeof feedback === 'object') return feedback;

  try {
    return JSON.parse(feedback);
  } catch {
    return {};
  }
}

function ModalSearch({ id, searchId, modalOpen, setModalOpen }) {
  const modalContent = useRef(null);
  const searchInput = useRef(null);

  const [query, setQuery] = useState('');
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch the user's interview history when the modal opens.
  useEffect(() => {
    if (!modalOpen) return;

    searchInput.current?.focus();

    const controller = new AbortController();

    const fetchInterviews = async () => {
      setLoading(true);
      setError('');

      try {
        const token = sessionStorage.getItem('interviewiq-token');

        if (!token) {
          throw new Error('Please log in to search your interviews.');
        }

        const response = await fetch(`${API_URL}/api/history`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Unable to load your interview history.');
        }

        const data = await response.json();

        setInterviews(
          Array.isArray(data.interviews) ? data.interviews : []
        );
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Something went wrong.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchInterviews();

    return () => controller.abort();
  }, [modalOpen]);

  // Close when clicking outside the modal.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        modalOpen &&
        modalContent.current &&
        !modalContent.current.contains(event.target)
      ) {
        setModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [modalOpen, setModalOpen]);

  // Close when Escape is pressed.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [setModalOpen]);

  // Search across interview data.
  const filteredInterviews = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();

    if (!searchTerm) return [];

    return interviews.filter((interview) => {
      const feedback = getFeedback(interview.feedback);

      const searchableContent = [
        interview.role,
        interview.level,
        interview.interview_type,
        interview.question,
        interview.answer,
        interview.score,
        feedback.summary,
        feedback.suggested_answer,
        feedback.follow_up_question,
        ...(Array.isArray(feedback.strengths) ? feedback.strengths : []),
        ...(Array.isArray(feedback.areas_for_improvement)
          ? feedback.areas_for_improvement
          : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableContent.includes(searchTerm);
    });
  }, [query, interviews]);

  const closeModal = () => {
    setModalOpen(false);
    setQuery('');
  };

  const quickPages = [
    { label: 'Dashboard', path: '/', description: 'Your interview overview' },
    { label: 'Mock Interview', path: '/mock-interview', description: 'Start a new practice session' },
    { label: 'Performance Analytics', path: '/analytics', description: 'View your performance' },
    { label: 'Interview History', path: '/history', description: 'Review previous interviews' },
    { label: 'Settings', path: '/settings', description: 'Manage your preferences' },
  ];

  const showQuickPages = query.trim().length === 0;

  return (
    <>
      <Transition
        className="fixed inset-0 bg-gray-900/30 z-50 transition-opacity"
        show={modalOpen}
        enter="transition ease-out duration-200"
        enterStart="opacity-0"
        enterEnd="opacity-100"
        leave="transition ease-out duration-100"
        leaveStart="opacity-100"
        leaveEnd="opacity-0"
        aria-hidden="true"
      />

      <Transition
        id={id}
        className="fixed inset-0 z-50 overflow-hidden flex items-start top-20 mb-4 justify-center px-4 sm:px-6"
        role="dialog"
        aria-modal="true"
        show={modalOpen}
        enter="transition ease-in-out duration-200"
        enterStart="opacity-0 translate-y-4"
        enterEnd="opacity-100 translate-y-0"
        leave="transition ease-in-out duration-200"
        leaveStart="opacity-100 translate-y-0"
        leaveEnd="opacity-0 translate-y-4"
      >
        <div
          ref={modalContent}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 overflow-auto max-w-2xl w-full max-h-[75vh] rounded-lg shadow-lg"
        >
          {/* Search input */}
          <form
            className="border-b border-gray-200 dark:border-gray-700/60"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="relative">
              <label htmlFor={searchId} className="sr-only">
                Search interviews
              </label>

              <input
                id={searchId}
                ref={searchInput}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full dark:text-gray-300 bg-white dark:bg-gray-800 border-0 focus:ring-transparent placeholder-gray-400 dark:placeholder-gray-500 appearance-none py-4 pl-11 pr-12"
                type="search"
                placeholder="Search roles, questions, answers or feedback..."
                autoComplete="off"
              />

              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 fill-current text-gray-400 dark:text-gray-500"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                aria-hidden="true"
              >
                <path d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7ZM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5Z" />
                <path d="m13.314 11.9 2.393 2.393a.999.999 0 1 1-1.414 1.414L11.9 13.314a8.019 8.019 0 0 0 1.414-1.414Z" />
              </svg>

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-violet-600"
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          <div className="py-4 px-3">

            {/* Quick navigation */}
            {showQuickPages && (
              <div className="mb-5">
                <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase px-2 mb-2">
                  Quick Navigation
                </div>

                <div className="space-y-1">
                  {quickPages.map((page) => (
                    <Link
                      key={page.path}
                      to={page.path}
                      onClick={closeModal}
                      className="flex items-center justify-between p-3 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/40 rounded-lg transition"
                    >
                      <div>
                        <p className="text-sm font-medium">{page.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {page.description}
                        </p>
                      </div>

                      <span className="text-gray-400">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Interview search results */}
            <div>
              <div className="flex items-center justify-between px-2 mb-2">
                <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
                  {query.trim()
                    ? 'Matching Interviews'
                    : 'Your Recent Interviews'}
                </div>

                <span className="text-xs text-gray-400">
                  {interviews.length} total
                </span>
              </div>

              {loading && (
                <p className="text-sm text-gray-500 dark:text-gray-400 p-3">
                  Loading your interviews...
                </p>
              )}

              {error && (
                <p className="text-sm text-red-500 p-3">
                  {error}
                </p>
              )}

              {!loading && !error && query.trim() && filteredInterviews.length === 0 && (
                <div className="p-6 text-center">
                  <div className="text-2xl mb-2">🔍</div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    No matching interviews found
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Try searching for a different role, question or keyword.
                  </p>
                </div>
              )}

              {!loading && !error && !query.trim() && interviews.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 p-3">
                  No interviews yet. Complete a mock interview to see it here.
                </p>
              )}

              {!loading && !error && (
                <div className="space-y-1">
                  {(query.trim()
                    ? filteredInterviews
                    : interviews
                  ).slice(0, 8).map((interview) => {
                    const feedback = getFeedback(interview.feedback);

                    return (
                      <Link
                        key={interview.id}
                        to="/history"
                        onClick={closeModal}
                        className="block p-3 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/40 rounded-lg transition"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold truncate">
                            {interview.role || 'Interview'}
                          </p>

                          <span className="shrink-0 text-xs font-semibold text-violet-600 dark:text-violet-400">
                            {interview.score ?? feedback.score ?? 'N/A'}/10
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {interview.question || 'No question available'}
                        </p>

                        {feedback.summary && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 line-clamp-1">
                            {feedback.summary}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <span>{interview.interview_type || 'Interview'}</span>
                          <span>•</span>
                          <span>{interview.level || 'Level unavailable'}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {!loading && !error && query.trim() && filteredInterviews.length > 8 && (
                <p className="text-xs text-center text-gray-400 mt-3">
                  Showing the first 8 results. Refine your search for more specific matches.
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700/60 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              InterviewIQ Search
            </span>

            <button
              type="button"
              onClick={closeModal}
              className="text-xs font-medium text-gray-500 hover:text-violet-600 dark:text-gray-400"
            >
              Close (Esc)
            </button>
          </div>
        </div>
      </Transition>
    </>
  );
}

export default ModalSearch;
