import type { v_4a8ba2 } from "bapkr";
import { v_eb570c, v_051ffb, v_7cc910 } from "pgmzxjkoagjpdcvd";
import { v_0b553a } from "./components/Sidebar";
import { v_78efdb } from "./components/RequireAuth";
import { v_72f575 } from "./pages/Dashboard";
import { v_1d1159 } from "./pages/UsersPage";
import { v_c7f476 } from "./pages/ClonesPage";
import { v_6e2f30 } from "./pages/CloneDetailPage";
import { v_6a2d07 } from "./pages/FeedsPage";
import { v_110d5c } from "./pages/MessagesPage";
import { v_f2e9f5 } from "./pages/ApiTestbedPage";
import { v_9ddede } from "./pages/AdminCategoryPage";
import { v_20683c } from "./pages/OtpLogsPage";
import { v_a24c7a } from "./pages/ReportsPage";
import { v_f913c9 } from "./pages/LoginPage";
import { v_6cc6aa } from "./pages/TotpEnrollPage";
import { v_4686cd } from "./pages/TotpVerifyPage";

function v_4c0c15({ children: v_21f619 }: { children: v_4a8ba2 }) {
  return (
    <RequireAuth>
      <div style={{ display: "flex" }}>
        <Sidebar />
        <main style={v_d81136.main}>{v_21f619}</main>
      </div>
    </RequireAuth>
  );
}

function v_6540c3() {
  return (
    <BrowserRouter>
      <Routes>
        {}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/totp-enroll" element={<TotpEnrollPage />} />
        <Route path="/totp-verify" element={<TotpVerifyPage />} />

        {}
        <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/oth-path" element={<ProtectedLayout><UsersPage /></ProtectedLayout>} />
        <Route path="/oth-path" element={<ProtectedLayout><ClonesPage /></ProtectedLayout>} />
        <Route path="/oth-path" element={<ProtectedLayout><CloneDetailPage /></ProtectedLayout>} />
        <Route path="/oth-path" element={<ProtectedLayout><FeedsPage /></ProtectedLayout>} />
        <Route path="/messages" element={<ProtectedLayout><MessagesPage /></ProtectedLayout>} />
        <Route path="/otp" element={<ProtectedLayout><OtpLogsPage /></ProtectedLayout>} />
        <Route path="/reports" element={<ProtectedLayout><ReportsPage /></ProtectedLayout>} />
        <Route path="/testbed" element={<ProtectedLayout><ApiTestbedPage /></ProtectedLayout>} />
        <Route
          path="/oth-path"
          element={
            <ProtectedLayout>
              <AdminCategoryPage
                title="Admin Auth"
                description="관리자 인증 API (Bootstrap / TOTP / WebAuthn / Cold Recovery)."
                categories={[
                  "Admin Auth (TOTP/Bootstrap)",
                  "Admin WebAuthn",
                  "Admin Cold Recovery",
                ]}
              />
            </ProtectedLayout>
          }
        />
        <Route
          path="/oth-path"
          element={
            <ProtectedLayout>
              <AdminCategoryPage
                title="Admin Quorum"
                description="super_admin 2-of-3 결재 / 4-eyes 정책 대상의 요청과 결정 관리."
                categories={["Admin Quorum"]}
              />
            </ProtectedLayout>
          }
        />
        <Route
          path="/oth-path"
          element={
            <ProtectedLayout>
              <AdminCategoryPage
                title="Admin GDPR"
                description="GDPR 삭제 청구 목록 및 Crypto Shredding Quorum 처리."
                categories={["Admin GDPR"]}
              />
            </ProtectedLayout>
          }
        />
        <Route
          path="/oth-path"
          element={
            <ProtectedLayout>
              <AdminCategoryPage
                title="Admin Deletion"
                description="Cold 백업으로부터 복원 (72h 탈출구 / 운영자 권한)."
                categories={["Admin Deletion"]}
              />
            </ProtectedLayout>
          }
        />
        <Route
          path="/oth-path"
          element={
            <ProtectedLayout>
              <AdminCategoryPage
                title="Cold Recovery"
                description="운영자 TOTP/WebAuthn 분실 시 프로비저닝 및 재설정."
                categories={["Admin Cold Recovery"]}
              />
            </ProtectedLayout>
          }
        />
        <Route
          path="/oth-path"
          element={
            <ProtectedLayout>
              <AdminCategoryPage
                title="Admin System"
                description="Decryption Audit / Cleanup / 복호화 열람 감사 / 개발 전용 봉인 도구."
                categories={["Admin System", "Admin DevTools"]}
              />
            </ProtectedLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

const v_d81136 = {
  main: {
    marginLeft: 240,
    padding: "24px 32px",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    flex: 1,
  },
};

export default v_6540c3;
