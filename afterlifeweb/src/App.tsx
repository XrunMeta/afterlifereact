import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { UsersPage } from "./pages/UsersPage";
import { ClonesPage } from "./pages/ClonesPage";
import { CloneDetailPage } from "./pages/CloneDetailPage";
import { FeedsPage } from "./pages/FeedsPage";
import { MessagesPage } from "./pages/MessagesPage";
import { ApiTestbedPage } from "./pages/ApiTestbedPage";
import { AdminCategoryPage } from "./pages/AdminCategoryPage";

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex" }}>
        <Sidebar />
        <main style={styles.main}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/oth-path" element={<UsersPage />} />
            <Route path="/oth-path" element={<ClonesPage />} />
            <Route path="/oth-path" element={<CloneDetailPage />} />
            <Route path="/oth-path" element={<FeedsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/testbed" element={<ApiTestbedPage />} />
            <Route
              path="/oth-path"
              element={
                <AdminCategoryPage
                  title="Admin Auth"
                  description="관리자 인증 API (Bootstrap / TOTP / WebAuthn / Cold Recovery)."
                  categories={[
                    "Admin Auth (TOTP/Bootstrap)",
                    "Admin WebAuthn",
                    "Admin Cold Recovery",
                  ]}
                />
              }
            />
            <Route
              path="/oth-path"
              element={
                <AdminCategoryPage
                  title="Admin Quorum"
                  description="super_admin 2-of-3 결재 / 4-eyes 정책 대상의 요청과 결정 관리."
                  categories={["Admin Quorum"]}
                />
              }
            />
            <Route
              path="/oth-path"
              element={
                <AdminCategoryPage
                  title="Admin GDPR"
                  description="GDPR 삭제 청구 목록 및 Crypto Shredding Quorum 처리."
                  categories={["Admin GDPR"]}
                />
              }
            />
            <Route
              path="/oth-path"
              element={
                <AdminCategoryPage
                  title="Admin Deletion"
                  description="Cold 백업으로부터 복원 (72h 탈출구 / 운영자 권한)."
                  categories={["Admin Deletion"]}
                />
              }
            />
            <Route
              path="/oth-path"
              element={
                <AdminCategoryPage
                  title="Cold Recovery"
                  description="운영자 TOTP/WebAuthn 분실 시 프로비저닝 및 재설정."
                  categories={["Admin Cold Recovery"]}
                />
              }
            />
            <Route
              path="/oth-path"
              element={
                <AdminCategoryPage
                  title="Admin System"
                  description="Decryption Audit / Cleanup / 복호화 열람 감사 / 개발 전용 봉인 도구."
                  categories={[
                    "Admin System",
                    "Admin DevTools",
                  ]}
                />
              }
            />
          </Routes>
        </main>
      </div>
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
