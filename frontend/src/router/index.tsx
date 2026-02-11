import AuthLayout from "@/layouts/AuthLayout";
import MainLayout from "@/layouts/MainLayout";
import AdminLayout from "@/layouts/AdminLayout";
import ExplorePage from "@/pages/activity/ExplorePage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import UsersPage from "@/pages/admin/UsersPage";
import { createBrowserRouter } from "react-router";

export const router = createBrowserRouter([
  // Auth routes - NO navbar
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
    ],
  },

  // Main USER ROLE routes - WITH navbar
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <ExplorePage /> },
      { path: "explore", element: <ExplorePage /> },
    ],
  },

  // Admin routes - requires ADMIN role
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <UsersPage /> },
    ],
  },
]);
