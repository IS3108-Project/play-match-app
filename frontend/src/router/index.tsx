import AuthLayout from "@/layouts/AuthLayout";
import MainLayout from "@/layouts/MainLayout";
import AdminLayout from "@/layouts/AdminLayout";
import ExplorePage from "@/pages/activity/ExplorePage";
import MyActivitiesPage from "@/pages/activity/MyActivitiesPage";
import CommunityPage from "@/pages/activity/CommunityPage";
import DiscussionPostPage from "@/pages/community/DiscussionPostPage";
import GroupDetailPage from "@/pages/community/GroupDetailPage";
import ProfilePage from "@/pages/user/ProfilePage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import OnboardingPage from "@/pages/onboarding/OnboardingPage";
import UsersPage from "@/pages/admin/UsersPage";
import { createBrowserRouter } from "react-router";

export const router = createBrowserRouter([
  // Auth routes (For users who have yet to log in) - NO navbar
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
    ],
  },

  // Onboarding route - NO navbar, requires auth
  { path: "/onboarding", element: <OnboardingPage /> },

  // Main USER ROLE routes - WITH navbar
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <ExplorePage /> },
      { path: "explore", element: <ExplorePage /> },
      { path: "my-activities", element: <MyActivitiesPage /> },
      { path: "community", element: <CommunityPage /> },
      { path: "community/discussions", element: <CommunityPage /> },
      { path: "community/discussions/:discussionId", element: <DiscussionPostPage /> },
      { path: "community/groups/:groupId", element: <GroupDetailPage /> },
      { path: "profile", element: <ProfilePage /> },
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
