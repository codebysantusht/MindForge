import { useState, useEffect } from 'react';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const STORAGE_KEY = 'interviewiq-settings';

const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const roles = [
  'Software Engineer',
  'Software Developer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Python Developer',
  'Java Developer',
  'C++ Developer',
  'JavaScript Developer',
  'Mobile App Developer',
  'Android Developer',
  'iOS Developer',
  'Game Developer',
  'Embedded Software Engineer',
  'QA Engineer',
  'Software Development Engineer in Test (SDET)',
  'Automation Test Engineer',
  'Cybersecurity Analyst',
  'SOC Analyst',
  'Security Engineer',
  'Penetration Tester',
  'Ethical Hacker',
  'Application Security Engineer',
  'Cloud Security Engineer',
  'Network Security Engineer',
  'Incident Response Analyst',
  'Digital Forensics Analyst',
  'Threat Intelligence Analyst',
  'Vulnerability Management Analyst',
  'Security Operations Engineer',
  'GRC Analyst',
  'IAM Engineer',
  'Malware Analyst',
  'Security Architect',
  'Red Team Operator',
  'Blue Team Analyst',
  'Detection Engineer',
  'DevSecOps Engineer',
  'DevOps Engineer',
  'Site Reliability Engineer (SRE)',
  'Cloud Engineer',
  'Cloud Architect',
  'Platform Engineer',
  'Systems Administrator',
  'Network Engineer',
  'Linux System Administrator',
  'Infrastructure Engineer',
  'IT Support Engineer',
  'Release Engineer',
  'Build Engineer',
  'Data Analyst',
  'Data Scientist',
  'Data Engineer',
  'Machine Learning Engineer',
  'AI Engineer',
  'Generative AI Engineer',
  'NLP Engineer',
  'Computer Vision Engineer',
  'Business Intelligence Analyst',
  'MLOps Engineer',
  'Research Engineer',
  'Analytics Engineer',
  'Database Administrator',
  'Database Engineer',
  'Solutions Architect',
  'Enterprise Application Developer',
  'Salesforce Developer',
  'ERP Consultant',
  'Technical Consultant',
  'SAP Consultant',
  'Product Manager',
  'Technical Product Manager',
  'Business Analyst',
  'Systems Analyst',
  'Technical Business Analyst',
  'IT Project Coordinator',
  'Technical Support Engineer',
  'Technical Account Manager',
  'Customer Success Engineer',
  'Pre-Sales Engineer',
  'IoT Engineer',
  'Robotics Software Engineer',
  'Firmware Engineer',
  'Blockchain Developer',
  'Hardware Engineer',
  'VLSI Design Engineer',
  'Graduate Engineer Trainee',
  'Associate Software Engineer',
  'IT Graduate Trainee',
  'Associate Technical Consultant',
];

function getSavedSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function MockInterview() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [role, setRole] = useState(() => {
    const saved = getSavedSettings();
    return saved.targetRole || 'Cybersecurity Analyst';
  });

  const [level, setLevel] = useState(() => {
    const saved = getSavedSettings();
    return saved.experienceLevel || 'Beginner';
  });

  const [difficultyLevel, setDifficultyLevel] = useState(() => {
    const saved = getSavedSettings();
    return saved.experienceLevel || 'Beginner';
  });

  const [interviewType, setInterviewType] = useState(() => {
    const saved = getSavedSettings();
    return saved.interviewType || 'Technical';
  });

  const [roleSearch, setRoleSearch] = useState('');
  const [showRoleOptions, setShowRoleOptions] = useState(false);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);

  const [secondsLeft, setSecondsLeft] = useState(null);
  const [questionsCompleted, setQuestionsCompleted] = useState(0);

  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);
  const [error, setError] = useState('');

  // Countdown timer
  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((previous) => {
        if (previous === null || previous <= 1) {
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const filteredRoles = roles.filter((item) =>
    item.toLowerCase().includes(roleSearch.toLowerCase())
  );

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(
      remainingSeconds
    ).padStart(2, '0')}`;
  };

  const generateQuestion = async () => {
    if (!role.trim()) {
      setError('Please select a target role.');
      return;
    }

    setLoadingQuestion(true);
    setError('');
    setQuestion('');
    setAnswer('');
    setFeedback(null);
    setSecondsLeft(null);

    try {
      const response = await fetch(`${API_URL}/api/generate-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('interviewiq-token')}`,
        },
        body: JSON.stringify({
          role,
          level: difficultyLevel,
          interview_type: interviewType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Unable to generate a question.');
      }

      setQuestion(data.question);
      setSecondsLeft(120);
    } catch (err) {
      setError(err.message || 'Could not connect to the backend.');
    } finally {
      setLoadingQuestion(false);
    }
  };

  const evaluateAnswer = async () => {
    if (!answer.trim()) {
      setError('Please enter your answer before submitting.');
      return;
    }

    if (secondsLeft === 0) {
      setError("Time is up. Generate the next question to continue.");
      return;
    }

    setLoadingEvaluation(true);
    setError('');
    setFeedback(null);

    try {
      const response = await fetch(`${API_URL}/api/evaluate-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('interviewiq-token')}`,
        },
        body: JSON.stringify({
          role,
          level: difficultyLevel,
          interview_type: interviewType,
          question,
          answer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Unable to evaluate your answer.');
      }

      setFeedback(data.feedback);
      setQuestionsCompleted((previous) => previous + 1);

      // Stop timer after successful evaluation
      setSecondsLeft(null);

      // Automatically adjust difficulty based on AI score
      const score = Number(data.feedback?.score);

      if (Number.isFinite(score)) {
        setDifficultyLevel((currentLevel) => {
          const currentIndex = DIFFICULTY_LEVELS.indexOf(currentLevel);

          if (score >= 8) {
            return DIFFICULTY_LEVELS[
              Math.min(currentIndex + 1, DIFFICULTY_LEVELS.length - 1)
            ];
          }

          if (score < 5) {
            return DIFFICULTY_LEVELS[
              Math.max(currentIndex - 1, 0)
            ];
          }

          return currentLevel;
        });
      }
    } catch (err) {
      setError(err.message || 'Could not connect to the backend.');
    } finally {
      setLoadingEvaluation(false);
    }
  };

  const score = feedback?.score;

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

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Mock Interview
              </h1>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Practice interview questions and get AI-powered feedback on your answers.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

              {/* Interview Setup */}
              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-1">

                <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white">
                  Interview Setup
                </h2>

                <div className="space-y-5">

                  {/* Searchable Target Role */}
                  <div className="relative">
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Target Role
                    </label>

                    <input
                      type="text"
                      value={showRoleOptions ? roleSearch : role}
                      onChange={(e) => {
                        setRoleSearch(e.target.value);
                        setShowRoleOptions(true);
                      }}
                      onFocus={() => {
                        setRoleSearch('');
                        setShowRoleOptions(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setShowRoleOptions(false);
                        }, 150);
                      }}
                      placeholder="Search your target role..."
                      autoComplete="off"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />

                    {showRoleOptions && (
                      <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">

                        {filteredRoles.length > 0 ? (
                          filteredRoles.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setRole(item);
                                setRoleSearch('');
                                setShowRoleOptions(false);
                              }}
                              className={`block w-full px-4 py-2.5 text-left text-sm hover:bg-violet-50 dark:hover:bg-gray-700 ${
                                role === item
                                  ? 'bg-violet-50 font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300'
                                  : 'text-gray-700 dark:text-gray-200'
                              }`}
                            >
                              {item}
                            </button>
                          ))
                        ) : (
                          <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            No matching roles found.
                          </p>
                        )}

                      </div>
                    )}
                  </div>

                  {/* Starting Experience Level */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Starting Experience Level
                    </label>

                    <select
                      value={level}
                      onChange={(e) => {
                        setLevel(e.target.value);
                        setDifficultyLevel(e.target.value);
                      }}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                    </select>
                  </div>

                  {/* Interview Type */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Interview Type
                    </label>

                    <select
                      value={interviewType}
                      onChange={(e) => setInterviewType(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option>Technical</option>
                      <option>HR</option>
                      <option>Mixed</option>
                    </select>
                  </div>

                  {/* Current Difficulty */}
                  <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 dark:border-violet-500/30 dark:bg-violet-500/10">
                    <p className="text-xs font-medium text-violet-700 dark:text-violet-300">
                      CURRENT QUESTION DIFFICULTY
                    </p>

                    <p className="mt-1 text-lg font-bold text-violet-800 dark:text-violet-200">
                      {difficultyLevel}
                    </p>

                    <p className="mt-1 text-xs text-violet-700 dark:text-violet-400">
                      Automatically adjusts based on your AI evaluation score.
                    </p>
                  </div>

                  <button
                    onClick={generateQuestion}
                    disabled={loadingQuestion || !role.trim()}
                    className="w-full rounded-lg bg-violet-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingQuestion ? 'Generating Question...' : 'Generate Question'}
                  </button>
                </div>

                <div className="mt-6 rounded-lg bg-violet-50 p-4 dark:bg-violet-500/10">
                  <p className="text-sm font-medium text-violet-800 dark:text-violet-300">
                    Interview Tip
                  </p>

                  <p className="mt-1 text-xs leading-5 text-violet-700 dark:text-violet-400">
                    Explain your thought process clearly and support your answers with practical examples.
                  </p>
                </div>
              </section>

              {/* Interview Question and Answer */}
              <section className="space-y-6 lg:col-span-2">

                {/* Question */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">

                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                      Interview Question
                    </h2>

                    <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                      AI Generated
                    </span>
                  </div>

                  {question ? (
                    <>
                      <div className="mb-5 rounded-lg bg-gray-50 p-5 dark:bg-gray-700/50">
                        <p className="text-base leading-7 text-gray-800 dark:text-gray-100">
                          {question}
                        </p>
                      </div>

                      {/* Timer */}
                      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                              Answer Timer
                            </p>

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              You have 2 minutes to answer.
                            </p>
                          </div>

                          <div
                            className={`text-2xl font-bold tabular-nums ${
                              secondsLeft === 0
                                ? 'text-red-600'
                                : secondsLeft <= 30
                                  ? 'text-red-500'
                                  : 'text-green-600 dark:text-green-400'
                            }`}
                          >
                            {secondsLeft === null
                              ? 'Completed'
                              : secondsLeft === 0
                                ? "Time's Up!"
                                : formatTime(secondsLeft)}
                          </div>
                        </div>

                        {secondsLeft !== null && (
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                secondsLeft <= 30
                                  ? 'bg-red-500'
                                  : 'bg-violet-600'
                              }`}
                              style={{
                                width: `${(secondsLeft / 120) * 100}%`,
                              }}
                            />
                          </div>
                        )}

                        {secondsLeft === 0 && (
                          <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
                            Your answering time has expired. Generate the next question to continue.
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed border-gray-200 px-5 py-12 text-center dark:border-gray-700">
                      <div className="mb-3 text-3xl">💬</div>

                      <p className="font-medium text-gray-700 dark:text-gray-200">
                        No question generated yet
                      </p>

                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Select your interview preferences and generate your first question.
                      </p>
                    </div>
                  )}
                </div>

                {/* Answer */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">

                  <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
                    Your Answer
                  </h2>

                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={!question || loadingEvaluation || secondsLeft === 0}
                    rows={7}
                    placeholder="Write your answer here..."
                    className="w-full resize-y rounded-lg border border-gray-300 bg-white p-4 text-sm text-gray-800 outline-none focus:border-violet-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
                  />

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Take your time and structure your answer clearly.
                    </p>

                    <button
                      onClick={evaluateAnswer}
                      disabled={
                        !question ||
                        !answer.trim() ||
                        loadingEvaluation ||
                        secondsLeft === 0 ||
                        secondsLeft === null
                      }
                      className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-violet-600 dark:hover:bg-violet-700"
                    >
                      {loadingEvaluation ? 'Evaluating...' : 'Submit Answer'}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                    {error}
                  </div>
                )}

                {/* AI Evaluation */}
                {feedback && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                          AI Evaluation
                        </h2>

                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Feedback based on your submitted answer
                        </p>
                      </div>

                      <div className="rounded-xl bg-violet-50 px-5 py-3 text-center dark:bg-violet-500/10">
                        <p className="text-3xl font-bold text-violet-700 dark:text-violet-300">
                          {score ?? '—'}
                          <span className="text-base font-medium">/10</span>
                        </p>

                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Overall Score
                        </p>
                      </div>
                    </div>

                    {/* Difficulty Progression Result */}
                    <div className="mb-5 rounded-lg border border-violet-200 bg-violet-50 p-4 dark:border-violet-500/30 dark:bg-violet-500/10">
                      <p className="text-sm font-semibold text-violet-800 dark:text-violet-300">
                        Difficulty Progression
                      </p>

                      <p className="mt-1 text-sm text-violet-700 dark:text-violet-200">
                        {Number(score) >= 8
                          ? 'Excellent performance! Your next question will be more difficult.'
                          : Number(score) < 5
                            ? 'Keep practising! Your next question will be easier.'
                            : 'Good effort! Your next question will maintain the same difficulty.'}
                      </p>

                      <p className="mt-2 text-xs font-medium text-violet-700 dark:text-violet-300">
                        Next question level: {difficultyLevel}
                      </p>
                    </div>

                    {feedback.summary && (
                      <div className="mb-5">
                        <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">
                          Summary
                        </h3>

                        <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                          {feedback.summary}
                        </p>
                      </div>
                    )}

                    {/* Evaluation Scores */}
                    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        ['Technical Correctness', feedback.technical_correctness],
                        ['Relevance', feedback.relevance],
                        ['Clarity', feedback.clarity],
                        ['Completeness', feedback.completeness],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50"
                        >
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {label}
                          </p>

                          <p className="mt-1 text-lg font-semibold text-gray-800 dark:text-white">
                            {value ?? '—'}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Strengths */}
                    {feedback.strengths && (
                      <div className="mb-5">
                        <h3 className="mb-2 text-sm font-semibold text-green-700 dark:text-green-400">
                          Strengths
                        </h3>

                        {Array.isArray(feedback.strengths) ? (
                          <ul className="list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-300">
                            {feedback.strengths.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {feedback.strengths}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Areas for Improvement */}
                    {feedback.areas_for_improvement && (
                      <div className="mb-5">
                        <h3 className="mb-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                          Areas for Improvement
                        </h3>

                        {Array.isArray(feedback.areas_for_improvement) ? (
                          <ul className="list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-300">
                            {feedback.areas_for_improvement.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {feedback.areas_for_improvement}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Suggested Answer */}
                    {feedback.suggested_answer && (
                      <div className="mb-5">
                        <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">
                          Suggested Answer
                        </h3>

                        <div className="rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300">
                          {feedback.suggested_answer}
                        </div>
                      </div>
                    )}

                    {/* Follow-up Question */}
                    {feedback.follow_up_question && (
                      <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 dark:border-violet-500/30 dark:bg-violet-500/10">
                        <h3 className="mb-2 text-sm font-semibold text-violet-800 dark:text-violet-300">
                          Follow-up Question
                        </h3>

                        <p className="text-sm text-violet-700 dark:text-violet-200">
                          {feedback.follow_up_question}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={generateQuestion}
                      disabled={loadingQuestion}
                      className="mt-6 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-50"
                    >
                      {loadingQuestion ? 'Generating...' : 'Generate Next Question'}
                    </button>
                  </div>
                )}

                {/* Progress */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Interview Progress
                      </p>

                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Successfully evaluated questions
                      </p>
                    </div>

                    <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                      {questionsCompleted}
                    </p>
                  </div>
                </div>

              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default MockInterview;
