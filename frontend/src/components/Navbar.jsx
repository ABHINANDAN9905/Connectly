import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import useNotifications from "../hooks/useNotifications";
import {
  BellIcon,
  LogOutIcon,
  ShipWheelIcon,
  ArrowLeft,
  UserIcon,
} from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const navigate = useNavigate();

  const isChatPage = location.pathname?.startsWith("/chat");
  const { totalUnread, isReady } = useNotifications();

  const { logoutMutation } = useLogout();

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between w-full">

          {/* Back Button + Logo */}
          <div className="flex items-center gap-3">
            {location.pathname !== "/" && (
              <button
                onClick={() => navigate(-1)}
                className="btn btn-ghost btn-circle"
                aria-label="Go Back"
              >
                <ArrowLeft className="h-6 w-6 text-base-content opacity-70" />
              </button>
            )}

            {isChatPage && (
              <Link to="/" className="flex items-center gap-2.5">
                <ShipWheelIcon className="size-9 text-primary" />
                <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
                  Connectly
                </span>
              </Link>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3 sm:gap-4">

            {/* Notifications */}
            <Link
              to="/notifications"
              className="btn btn-ghost btn-circle relative"
              aria-label={`Notifications${totalUnread > 0 ? `, ${totalUnread} unread` : ""}`}
            >
              <BellIcon className="h-6 w-6 text-base-content opacity-70" />
              {isReady && totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1 leading-none">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </Link>

            {/* Theme Selector */}
            <ThemeSelector />

            {/* Avatar */}
            <Link to="/profile" aria-label="View profile">
              <div className="avatar">
                <div className="w-9 rounded-full ring ring-primary/20 ring-offset-base-100 ring-offset-1">
                  {authUser?.profilePic ? (
                    <img
                      src={authUser.profilePic}
                      alt="User Avatar"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-base-300">
                      <UserIcon className="size-5 opacity-60" />
                    </div>
                  )}
                </div>
              </div>
            </Link>

            {/* Logout */}
            <button
              className="btn btn-ghost btn-circle"
              onClick={logoutMutation}
              aria-label="Logout"
            >
              <LogOutIcon className="h-6 w-6 text-base-content opacity-70" />
            </button>

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;