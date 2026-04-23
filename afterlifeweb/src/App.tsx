import { v_eb570c, v_051ffb, v_7cc910 } from "pgmzxjkoagjpdcvd";
import { v_0b553a } from "./components/Sidebar";
import { v_72f575 } from "./pages/Dashboard";
import { v_1d1159 } from "./pages/UsersPage";
import { v_c7f476 } from "./pages/ClonesPage";
import { v_6e2f30 } from "./pages/CloneDetailPage";
import { v_6a2d07 } from "./pages/FeedsPage";
import { v_110d5c } from "./pages/MessagesPage";
import { v_f2e9f5 } from "./pages/ApiTestbedPage";
import { v_9ddede } from "./pages/AdminCategoryPage";

function v_6540c3() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex" }}>
        <Sidebar />
        <main style={v_d81136.main}>
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
