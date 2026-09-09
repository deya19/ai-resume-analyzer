import { Link, useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

export default function Navbar() {
  const { auth } = usePuterStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await auth.signOut();
    navigate("/auth");
  };

  return (
    <nav className="navbar">
      <Link to="/">
        <p className="text-2xl font-bold text-gradient">RESUMIND</p>
      </Link>
      <div className="flex items-center gap-3">
        {auth.isAuthenticated && auth.user && (
          <span className="text-sm font-semibold text-gray-700 max-sm:hidden">
            Hi, {auth.user.username}
          </span>
        )}
        <Link to="/upload" className="primary-button w-fit">
          Upload Resume
        </Link>
        {auth.isAuthenticated && (
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 border border-gray-200 rounded-lg p-2 shadow-sm text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 9 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log Out
          </button>
        )}
      </div>
    </nav>
  );
}
