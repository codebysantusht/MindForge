
import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

const navigation = [
  {
    section: "WORKSPACE",
    items: [
      { label: "Dashboard", path: "/", icon: "dashboard" },
      { label: "Mock Interview", path: "/mock-interview", icon: "interview" },
      { label: "Performance Analytics", path: "/analytics", icon: "analytics" },
      { label: "Interview History", path: "/history", icon: "history" },
    ],
  },
  {
    section: "PREFERENCES",
    items: [
      { label: "Settings", path: "/settings", icon: "settings" },
    ],
  },
];

const icons = {
  dashboard: (
    <path d="M3 3h4v4H3V3Zm10 0h4v4h-4V3ZM3 13h4v4H3v-4Zm10 0h4v4h-4v-4Z" />
  ),
  interview: (
    <>
      <path d="M8 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
      <path d="M1 15a7 7 0 0 1 14 0v1H1v-1Z" />
      <path d="M14 5h2v6h-2z" />
    </>
  ),
  analytics: (
    <path d="M2 14h3V8H2v6Zm5 0h3V3H7v11Zm5 0h3V6h-3v8Zm5 0h3V1h-3v13Z" />
  ),
  history: (
    <>
      <path d="M8 2a6 6 0 1 1-5.65 8H4.5a4 4 0 1 0 .9-4.1L7 7H2V2l1.98 1.98A5.97 5.97 0 0 1 8 2Z" />
      <path d="M8 4v4l3 2-.8 1.2L7 9V4h1Z" />
    </>
  ),
  settings: (
    <path d="M9.7 1.5a1 1 0 0 0-1.4 0l-.8.8-1.1-.1-1-.5a1 1 0 0 0-1.3.5l-.5 1.2.5 1-0.5 1-1.2.5a1 1 0 0 0-.5 1.3l.5 1-.1 1.1-.8.8a1 1 0 0 0 0 1.4l.8.8-.1 1.1-.5 1a1 1 0 0 0 .5 1.3l1.2.5 1-.5 1 .5.5 1.2a1 1 0 0 0 1.3.5l1-.5 1.1.1.8.8a1 1 0 0 0 1.4 0l.8-.8 1.1.1 1 .5a1 1 0 0 0 1.3-.5l.5-1.2-.5-1 .5-1 1.2-.5a1 1 0 0 0 .5-1.3l-.5-1 .1-1.1.8-.8a1 1 0 0 0 0-1.4l-.8-.8.1-1.1.5-1a1 1 0 0 0-.5-1.3l-1.2-.5-1 .5-1-.5-.5-1.2a1 1 0 0 0-1.3-.5l-1 .5-1.1-.1-.8-.8ZM9 6a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
  ),
};

function Sidebar({ sidebarOpen, setSidebarOpen, variant = "default" }) {
  const location = useLocation();
  const sidebarRef = useRef(null);
  const triggerRef = useRef(null);

  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    return localStorage.getItem("sidebar-expanded") === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebar-expanded", String(sidebarExpanded));

    document.body.classList.toggle("sidebar-expanded", sidebarExpanded);

    return () => {
      document.body.classList.remove("sidebar-expanded");
    };
  }, [sidebarExpanded]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setSidebarOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [sidebarOpen, setSidebarOpen]);

  const closeMobileSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-w-fit">
      <div
        className={`fixed inset-0 bg-gray-900/30 z-40 lg:hidden transition-opacity duration-200 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      <aside
        id="sidebar"
        ref={sidebarRef}
        className={`flex flex-col absolute z-40 left-0 top-0 lg:static h-[100dvh] overflow-y-auto no-scrollbar w-64 shrink-0 bg-white dark:bg-gray-800 p-4 transition-all duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-64"
        } lg:translate-x-0 ${
          sidebarExpanded ? "lg:w-64" : "lg:w-20"
        } 2xl:w-64 ${
          variant === "v2"
            ? "border-r border-gray-200 dark:border-gray-700/60"
            : "rounded-r-2xl shadow-xs"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between mb-10 px-2">
          <NavLink
            to="/"
            end
            onClick={closeMobileSidebar}
            className="flex items-center gap-3 min-w-0"
          >
            <div className="w-10 h-10 shrink-0 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <span className="text-white text-xl font-bold">I</span>
            </div>

            <div className="lg:hidden lg:sidebar-expanded:block 2xl:block min-w-0">
              <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 tracking-tight">
                InterviewIQ
              </h1>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                AI Interview Assistant
              </p>
            </div>
          </NavLink>

          <button
            ref={triggerRef}
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-violet-500"
            aria-label="Close sidebar"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7l-1.4-1.4L9.2 12 2.9 5.7l1.4-1.4 6.3 6.3 6.3-6.3z" />
            </svg>
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="space-y-8">
          {navigation.map((group) => (
            <div key={group.section}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 pl-3 mb-3">
                <span className="hidden lg:block lg:sidebar-expanded:hidden 2xl:hidden text-center">
                  •••
                </span>
                <span className="lg:hidden lg:sidebar-expanded:block 2xl:block">
                  {group.section}
                </span>
              </h3>

              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === "/"}
                      onClick={closeMobileSidebar}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition duration-150 ${
                          isActive
                            ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        }`
                      }
                    >
                      <svg
                        className="w-5 h-5 shrink-0 fill-current"
                        viewBox="0 0 20 20"
                      >
                        {icons[item.icon]}
                      </svg>

                      <span className="text-sm font-medium truncate lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                        {item.label}
                      </span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="mt-auto pt-8">
          <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-500/10 lg:hidden lg:sidebar-expanded:block 2xl:block">
            <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">
              Practice. Improve. Succeed.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Your personal AI interview coach.
            </p>
          </div>

          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="hidden lg:flex items-center justify-center w-full mt-4 py-2 text-gray-400 hover:text-violet-500 transition"
            title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            <svg
              className={`w-5 h-5 fill-current transition-transform ${
                sidebarExpanded ? "rotate-180" : ""
              }`}
              viewBox="0 0 20 20"
            >
              <path d="M7 4 13 10 7 16 5.6 14.6 10.2 10 5.6 5.4 7 4Z" />
            </svg>
          </button>
        </div>
      </aside>
    </div>
  );
}

export default Sidebar;
