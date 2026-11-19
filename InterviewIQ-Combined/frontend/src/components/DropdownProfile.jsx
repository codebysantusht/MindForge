
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Transition from "../utils/Transition";

import UserAvatar from "../images/user-avatar-32.png";

function DropdownProfile({ align }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);

  const trigger = useRef(null);
  const dropdown = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const savedUser = sessionStorage.getItem("interviewiq-user");

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch {
      setUser(null);
    }
  }, []);

  const handleLogout = () => {
    // Clear the current login session.
    sessionStorage.removeItem("interviewiq-token");
    sessionStorage.removeItem("interviewiq-user");

    setUser(null);
    setDropdownOpen(false);

    // Return to the login page.
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const clickHandler = ({ target }) => {
      if (!dropdown.current || !trigger.current) return;

      if (
        !dropdownOpen ||
        dropdown.current.contains(target) ||
        trigger.current.contains(target)
      ) {
        return;
      }

      setDropdownOpen(false);
    };

    const keyHandler = (event) => {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("click", clickHandler);
    document.addEventListener("keydown", keyHandler);

    return () => {
      document.removeEventListener("click", clickHandler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [dropdownOpen]);

  const displayName = user?.full_name || "InterviewIQ User";
  const displayEmail = user?.email || "Interview Preparation";

  return (
    <div className="relative inline-flex">
      {/* Profile Trigger */}
      <button
        ref={trigger}
        className="inline-flex justify-center items-center group"
        aria-haspopup="true"
        aria-expanded={dropdownOpen}
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <img
          className="w-8 h-8 rounded-full"
          src={UserAvatar}
          width="32"
          height="32"
          alt="User profile"
        />

        <div className="flex items-center truncate">
          <span className="truncate ml-2 text-sm font-medium text-gray-600 dark:text-gray-100 group-hover:text-gray-800 dark:group-hover:text-white">
            {displayName}
          </span>

          <svg
            className="w-3 h-3 shrink-0 ml-1 fill-current text-gray-400 dark:text-gray-500"
            viewBox="0 0 12 12"
          >
            <path d="M5.9 11.4L.5 6l1.4-1.4 4 4 4-4L11.3 6z" />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      <Transition
        className={`origin-top-right z-50 absolute top-full min-w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 py-1.5 rounded-lg shadow-lg overflow-hidden mt-2 ${
          align === "right" ? "right-0" : "left-0"
        }`}
        show={dropdownOpen}
        enter="transition ease-out duration-200 transform"
        enterStart="opacity-0 -translate-y-2"
        enterEnd="opacity-100 translate-y-0"
        leave="transition ease-out duration-200"
        leaveStart="opacity-100"
        leaveEnd="opacity-0"
      >
        <div ref={dropdown}>
          {/* User Information */}
          <div className="pt-2 pb-3 px-4 mb-1 border-b border-gray-200 dark:border-gray-700/60">
            <div className="flex items-center gap-3">
              <img
                src={UserAvatar}
                alt="User profile"
                className="w-10 h-10 rounded-full"
              />

              <div className="min-w-0">
                <div className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">
                  {displayName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {displayEmail}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Links */}
          <ul>
            <li>
              <Link
                to="/"
                className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 flex items-center py-2 px-4"
                onClick={() => setDropdownOpen(false)}
              >
                Dashboard
              </Link>
            </li>

            <li>
              <Link
                to="/settings"
                className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 flex items-center py-2 px-4"
                onClick={() => setDropdownOpen(false)}
              >
                Settings
              </Link>
            </li>
          </ul>

          {/* Logout */}
          <div className="border-t border-gray-200 dark:border-gray-700/60 mt-1 pt-1">
            <button
              onClick={handleLogout}
              className="w-full text-left font-medium text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 flex items-center py-2 px-4"
            >
              <span className="mr-2">↪</span>
              Logout
            </button>

            <div className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500">
              Powered by InterviewIQ
            </div>
          </div>
        </div>
      </Transition>
    </div>
  );
}

export default DropdownProfile;
