import { v_58d265 } from "wtmgqhsnsiyp";
import { v_1c1837 } from "./layouts/MainLayout";
import { v_963706 } from "./layouts/AuthLayout";

import { v_f913c9 } from "./pages/auth/LoginPage";
import { v_e1f211 } from "./pages/auth/SignupPage";

import { v_f89e76 } from "./pages/home/HomePage";
import { v_31e4c0 } from "./pages/clones/MyClonesDashboardPage";
import { v_f40b5e } from "./pages/clones/CloneEditPage";
import { v_c7f3a8 } from "./pages/shorts/ShortsPage";
import { v_0e1c8d } from "./pages/my/MyPage";

import { v_618fb2 } from "./pages/clone-creation/Step1CloneType";
import { v_4fedcc } from "./pages/clone-creation/Step2BasicInfo";
import { v_c16410 } from "./pages/clone-creation/Step3ImageUpload";
import { v_179d51 } from "./pages/clone-creation/Step4VoiceUpload";
import { v_f4e6c4 } from "./pages/clone-creation/Step5Visibility";
import { v_128da5 } from "./pages/clone-creation/Step6Creating";
import { v_03fd71 } from "./pages/clone-creation/Step7Complete";

import { v_6e2f30 } from "./pages/clone-interaction/CloneDetailPage";
import { v_28984f } from "./pages/clone-interaction/ChatPage";
import { v_9219ea } from "./pages/clone-interaction/CallPage";

const v_5e863e = () => (
  <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-white">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-zinc-400">페이지를 찾을 수 없습니다</p>
    </div>
  </div>
);

export const v_904d46 = v_58d265([
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