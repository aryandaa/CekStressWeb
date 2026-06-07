import { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate, NavLink } from "react-router-dom";
import SidebarItem from "./SidebarItem";
import logo from "../../assets/img/logo.png";
import IconsSidebar from "./IconsSidebar";

// Contexts
import { useLanguage } from "../../contexts/LanguageContext";
import { useUser } from "../../contexts/UserContext";
import { logout as logoutApi } from "../../services/authService";

function Sidebar({ isOpen, setIsOpen }) {
  const { t } = useLanguage();
  const { setUser } = useUser();
  const navigate = useNavigate();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const executeLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    try {
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } catch (err) {
      console.error("Logout API failed:", err);
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser({ fullname: "", email: "", role: "", profileImage: null, createdAt: null });
    navigate("/login", { replace: true });
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-40
          flex h-screen w-60 flex-col
          theme-sidebar
          px-4 py-8
          transition-transform duration-300

          ${isOpen ? "translate-x-0" : "-translate-x-full"}

          md:translate-x-0
        `}
      >
   
      <div className="mb-10 flex items-center justify-between gap-5">
        <img
          src={logo}
          alt="CekTenang"
          className="h-auto w-28 object-contain"
        />

        {/* Close Mobile */}
        <button
          onClick={() => setIsOpen(false)}
          className="
            flex h-10 w-10 items-center justify-center
            rounded-xl  
            border theme-border-soft
            theme-card-muted
            theme-muted
            transition-all duration-200
            theme-hover
            md:hidden
          "
        >
          ✕
        </button>
      </div>

        <nav className="flex flex-1 flex-col">
          <div className="space-y-3">
            <SidebarItem
              to="/dashboard"
              icon={
                <IconsSidebar
                  paths={
                    <path
                      d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                  }
                />
              }
              end
            >
              Dashboard
            </SidebarItem>

            <SidebarItem
              to="/activity-history"
              icon={
                <IconsSidebar
                  paths={
                    <>
                      <path
                        d="M4 6h8M4 10h6M4 14h5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <path
                        d="m14 16 2 2 4-5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </>
                  }
                />
              }
            >
              {t.ActSdbr}
            </SidebarItem>

            <SidebarItem
              to="/summary"
              icon={
                <IconsSidebar
                  paths={
                    <>
                      <path
                        d="M8 18v-1.5a4 4 0 0 1 8 0V18M7 10a5 5 0 1 1 10 0c0 2.2-1.2 3.5-2.3 4.3H9.3C8.2 13.5 7 12.2 7 10Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M10 21h4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </>
                  }
                />
              }
            >
              {t.CekStresSdbr}
            </SidebarItem>

            <SidebarItem
              to="/profile"
              icon={
                <IconsSidebar
                  paths={
                    <>
                      <path
                        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </>
                  }
                />
              }
            >
              {t.ProfileSdbr}
            </SidebarItem>
          </div>

          <div className="mt-auto">
            <NavLink
              to="/LogActivity"
              className={({ isActive }) => `
                flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-sm mb-4
                ${isActive 
                  ? "bg-blue-600 text-white shadow-blue-500/20" 
                  : "bg-blue-500/15 text-blue-600 dark:text-blue-400 dark:bg-blue-500/10 hover:bg-blue-500/20 theme-border-soft border"
                }
              `}
            >
              <span className="text-lg font-bold">+</span>
              <span>{t.StressCheck}</span>
            </NavLink>

             <button
              type="button"
              onClick={handleLogout}
              className="
                flex w-full items-center gap-2 py-3 text-sm font-medium transition-colors
                theme-muted hover:text-(--text)
              "
            >
              <span>
                <IconsSidebar
                  paths={
                    <>
                      <path
                        d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </>
                  }
                />
              </span>
              <span className="text-[15px] leading-normal whitespace-nowrap">
                {t.LogoutSdbr}
              </span>
            </button>
          </div>

        </nav>
      </aside>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
          <div className="theme-card w-full max-w-sm rounded-3xl border p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </div>
            </div>

            <h3 className="theme-text text-xl font-bold">
              {t.DashboardDateLocale === "id-ID" ? "Keluar dari Akun?" : "Log Out of Account?"}
            </h3>
            <p className="theme-muted mt-2 text-sm leading-relaxed">
              {t.DashboardDateLocale === "id-ID" 
                ? "Apakah Anda yakin ingin keluar? Anda perlu masuk kembali untuk mengakses catatan aktivitas dan riwayat tingkat stres Anda."
                : "Are you sure you want to log out? You will need to log back in to access your activity logs and stress history."}
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="theme-card-muted h-12 flex-1 rounded-xl border px-4 text-sm font-semibold transition theme-hover"
              >
                {t.DashboardDateLocale === "id-ID" ? "Batal" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={executeLogout}
                className="h-12 flex-1 rounded-xl bg-red-500 text-white text-sm font-bold shadow-md shadow-red-500/20 transition hover:bg-red-600 hover:shadow-lg"
              >
                {t.DashboardDateLocale === "id-ID" ? "Keluar" : "Log Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

Sidebar.propTypes = {
  isOpen: PropTypes.bool,
  setIsOpen: PropTypes.func,
};

export default Sidebar;
