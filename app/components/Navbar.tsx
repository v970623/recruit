import { useNavigate, useLocation } from "@remix-run/react";
import { Form } from "@remix-run/react";
import type { ReactNode } from "react";
import * as React from "react";

type UserRole = "ADMIN" | "APPLICANT" | "RECRUITER";

interface NavbarProps {
  title: string;
  showBackButton?: boolean;
  rightContent?: ReactNode;
  isAuthenticated?: boolean;
  role?: UserRole;
}

const HIDE_BACK_BUTTON_PATHS = ["/jobs", "/login", "/register"];

const Navbar = ({
  title,
  showBackButton = true,
  rightContent,
  isAuthenticated = false,
  role = "APPLICANT",
}: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (location.pathname.includes("jobs")) {
      navigate("/jobs");
    } else {
      navigate(-1);
    }
  };

  const shouldShowBackButton = () => {
    if (!showBackButton) return false;
    return !HIDE_BACK_BUTTON_PATHS.includes(location.pathname);
  };

  const renderAuthButtons = () => {
    if (!isAuthenticated) {
      return (
        <button
          onClick={() => navigate("/login")}
          className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          登录
        </button>
      );
    }
    return (
      <div className="flex items-center gap-4">
        {/* 管理员可以查看所有申请，招聘方只能查看自己发布职位的申请 */}
        {(role === "ADMIN" || role === "RECRUITER") && (
          <button
            onClick={() =>
              navigate(role === "ADMIN" ? "/applications" : "/applications/my")
            }
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none"
          >
            {role === "ADMIN" ? "查看所有申请" : "查看职位申请"}
          </button>
        )}

        {/* 只有招聘方可以发布职位 */}
        {role === "RECRUITER" && (
          <button
            onClick={() => navigate("/jobs/new")}
            className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            发布职位
          </button>
        )}

        <Form action="/logout" method="post">
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            退出
          </button>
        </Form>
      </div>
    );
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="px-4 py-3 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {shouldShowBackButton() && (
              <button
                onClick={handleBack}
                className="p-2 mr-2 text-gray-600 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                aria-label="返回"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {rightContent}
            {renderAuthButtons()}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
