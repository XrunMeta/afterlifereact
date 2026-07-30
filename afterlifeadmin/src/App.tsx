import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { RequireAuth } from "./components/RequireAuth";
import { Dashboard } from "./pages/Dashboard";
import { UsersPage } from "./pages/UsersPage";
import { ClonesPage } from "./pages/ClonesPage";
import { CloneDetailPage } from "./pages/CloneDetailPage";
import { FeedsPage } from "./pages/FeedsPage";
import { MessagesPage } from "./pages/MessagesPage";
import { ApiTestbedPage } from "./pages/ApiTestbedPage";
import { AdminCategoryPage } from "./pages/AdminCategoryPage";
import { OtpLogsPage } from "./pages/OtpLogsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { UserReportsPage } from "./pages/UserReportsPage";
import { ReportPenaltyRulesPage } from "./pages/ReportPenaltyRulesPage";
import { LoginPage } from "./pages/LoginPage";
import { TotpEnrollPage } from "./pages/TotpEnrollPage";
import { TotpVerifyPage } from "./pages/TotpVerifyPage";
import { L0PersonaEditPage } from "./pages/L0PersonaEditPage";
import { PersonaQuestionsEditPage } from "./pages/PersonaQuestionsEditPage";
import { VoicePresetsPage } from "./pages/VoicePresetsPage";

function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <div style={{ display: "flex" }}>
        <Sidebar />
        <main style={styles.main}>{children}</main>
      </div>
    </RequireAuth>
  );
}

function App() {
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
        <Route path="/oth-path-reports" element={<ProtectedLayout><UserReportsPage /></ProtectedLayout>} />
        <Route path="/report-rules" element={<ProtectedLayout><ReportPenaltyRulesPage /></ProtectedLayout>} />
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
        <Route
          path="/oth-path"
          element={
            <ProtectedLayout>
              <L0PersonaEditPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/oth-path"
          element={
            <ProtectedLayout>
              <PersonaQuestionsEditPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/oth-path"
          element={
            <ProtectedLayout>
              <VoicePresetsPage />
            </ProtectedLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    marginLeft: 240,
    padding: "24px 32px",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    flex: 1,
  },
};

export default App;
