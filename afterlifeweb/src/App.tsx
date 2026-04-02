import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { UsersPage } from "./pages/UsersPage";
import { ClonesPage } from "./pages/ClonesPage";
import { FeedsPage } from "./pages/FeedsPage";
import { MessagesPage } from "./pages/MessagesPage";

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
            <Route path="/oth-path" element={<FeedsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
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
