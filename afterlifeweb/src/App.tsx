import { v_eb570c, v_051ffb, v_7cc910 } from "pgmzxjkoagjpdcvd";
import { v_0b553a } from "./components/Sidebar";
import { v_72f575 } from "./pages/Dashboard";
import { v_1d1159 } from "./pages/UsersPage";
import { v_c7f476 } from "./pages/ClonesPage";
import { v_6a2d07 } from "./pages/FeedsPage";
import { v_110d5c } from "./pages/MessagesPage";

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
            <Route path="/oth-path" element={<FeedsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
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
