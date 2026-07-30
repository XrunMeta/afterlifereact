import { NavLink, useNavigate } from "react-router-dom";
import { getProfile } from "../lib/auth";
import { logout } from "../api/adminAuth";

interface MenuGroup {
  label: string;
  items: { path: string; label: string; end?: boolean }[];
}

const menu: MenuGroup[] = [
  {
    label: "Overview",
    items: [
      { path: "/", label: "Dashboard", end: true },
      { path: "/testbed", label: "API Testbed" },
    ],
  },
  {
    label: "Data",
    items: [
      { path: "/oth-path", label: "Users" },
      { path: "/oth-path", label: "Clones" },
      { path: "/oth-path", label: "Feeds" },
      { path: "/messages", label: "Messages" },
      { path: "/otp", label: "OTP" },
      { path: "/reports", label: "Reports (Personas)" },
      { path: "/oth-path-reports", label: "Reports (Users)" },
      { path: "/report-rules", label: "신고 누적 조건" },
    ],
  },
  {
    label: "Admin Ops",
    items: [
      { path: "/oth-path", label: "Auth (TOTP/WebAuthn)" },
      { path: "/oth-path", label: "Quorum" },
      { path: "/oth-path", label: "GDPR" },
      { path: "/oth-path", label: "Deletion" },
      { path: "/oth-path", label: "Cold Recovery" },
      { path: "/oth-path", label: "System" },
      { path: "/oth-path", label: "L0 Persona" },
      { path: "/oth-path", label: "페르소나 질문" },
      { path: "/oth-path", label: "음색 카탈로그" },
    ],
  },
];

export function Sidebar() {
  const profile = getProfile();
  const navigate = useNavigate();
  function onLogout() {
    logout();
    navigate("/login", { replace: true });
  }
  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <h2 style={{ margin: 0 }}>AfterLife</h2>
        <span style={styles.badge}>Admin</span>
      </div>
      <nav style={styles.nav}>
        {menu.map((group) => (
          <div key={group.label} style={styles.group}>
            <div style={styles.groupLabel}>{group.label}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                style={({ isActive }) => ({
                  ...styles.link,
                  backgroundColor: isActive ? "#3b82f6" : "transparent",
                  color: isActive ? "#fff" : "#cbd5e1",
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      {profile && (
        <div style={styles.footer}>
          <div style={styles.profileEmail}>{profile.email}</div>
          <div style={styles.profileRole}>{profile.role}</div>
          <button onClick={onLogout} style={styles.logoutBtn}>
            로그아웃
          </button>
        </div>
      )}
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 240,
    backgroundColor: "#1e293b",
    height: "100vh",
    position: "fixed",
    left: 0,
    top: 0,
    display: "flex",
    flexDirection: "column",
    padding: "20px 0",
    overflowY: "auto",
  },
  logo: {
    padding: "0 20px 20px",
    borderBottom: "1px solid #334155",
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#fff",
  },
  badge: {
    fontSize: 11,
    backgroundColor: "#3b82f6",
    padding: "2px 8px",
    borderRadius: 4,
    color: "#fff",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "16px 12px",
  },
  group: { display: "flex", flexDirection: "column", gap: 2, marginBottom: 12 },
  groupLabel: {
    fontSize: 10,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    padding: "4px 12px",
    fontWeight: 700,
  },
  link: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
    borderRadius: 6,
    textDecoration: "none",
    fontSize: 13,
    transition: "background-color 0.2s",
  },
  footer: {
    marginTop: "auto",
    padding: "12px 16px",
    borderTop: "1px solid #334155",
    color: "#cbd5e1",
  },
  profileEmail: { fontSize: 12, wordBreak: "break-all", marginBottom: 2 },
  profileRole: { fontSize: 10, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase" },
  logoutBtn: {
    width: "100%",
    padding: "6px 10px",
    backgroundColor: "transparent",
    color: "#cbd5e1",
    border: "1px solid #334155",
    borderRadius: 4,
    fontSize: 12,
    cursor: "pointer",
  },
};
