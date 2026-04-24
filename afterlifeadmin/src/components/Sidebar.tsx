import { NavLink } from "react-router-dom";

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
    ],
  },
];

export function Sidebar() {
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
};
