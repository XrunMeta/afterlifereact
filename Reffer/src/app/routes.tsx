import { createBrowserRouter } from "react-router";
import { MainLayout } from "./layouts/MainLayout";
import { AuthLayout } from "./layouts/AuthLayout";

import { LoginPage } from "./pages/auth/LoginPage";
import { SignupPage } from "./pages/auth/SignupPage";

import { HomePage } from "./pages/home/HomePage";
import { MyClonesDashboardPage } from "./pages/clones/MyClonesDashboardPage";
import { CloneEditPage } from "./pages/clones/CloneEditPage";
import { ShortsPage } from "./pages/shorts/ShortsPage";
import { MyPage } from "./pages/my/MyPage";

import { Step1CloneType } from "./pages/clone-creation/Step1CloneType";
import { Step2BasicInfo } from "./pages/clone-creation/Step2BasicInfo";
import { Step3ImageUpload } from "./pages/clone-creation/Step3ImageUpload";
import { Step4VoiceUpload } from "./pages/clone-creation/Step4VoiceUpload";
import { Step5Visibility } from "./pages/clone-creation/Step5Visibility";
import { Step6Creating } from "./pages/clone-creation/Step6Creating";
import { Step7Complete } from "./pages/clone-creation/Step7Complete";

import { CloneDetailPage } from "./pages/clone-interaction/CloneDetailPage";
import { ChatPage } from "./pages/clone-interaction/ChatPage";
import { CallPage } from "./pages/clone-interaction/CallPage";

const NotFound = () => (
  <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-white">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-zinc-400">페이지를 찾을 수 없습니다</p>
    </div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: "/oth-path",
    element: <AuthLayout />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
    ],
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "clones", element: <MyClonesDashboardPage /> },
      { path: "shorts", element: <ShortsPage /> },
      { path: "my", element: <MyPage /> },

      { path: "clone/create/step1", element: <Step1CloneType /> },
      { path: "clone/create/step2", element: <Step2BasicInfo /> },
      { path: "clone/create/step3", element: <Step3ImageUpload /> },
      { path: "clone/create/step4", element: <Step4VoiceUpload /> },
      { path: "clone/create/step5", element: <Step5Visibility /> },
      { path: "clone/create/step6", element: <Step6Creating /> },
      { path: "clone/create/step7", element: <Step7Complete /> },

      { path: "clone/:id", element: <CloneDetailPage /> },
      { path: "clone/:id/edit", element: <CloneEditPage /> },
      { path: "clone/:id/chat", element: <ChatPage /> },
      { path: "clone/:id/call", element: <CallPage /> },

      { path: "*", element: <NotFound /> },
    ],
  },
]);