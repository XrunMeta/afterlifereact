import { NavLink } from "react-router-dom";

const menuItems = [
  { path: "/", label: "Dashboard" },
  { path: "/oth-path", label: "Users" },
  { path: "/oth-path", label: "Clones" },
  { path: "/oth-path", label: "Feeds" },
  { path: "/messages", label: "Messages" },
];

export function Sidebar() {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <h2 style={{ margin: 0 }}>AfterLife</h2>
        <span style={styles.badge}>Admin</span>
      </div>
      <nav style={styles.nav}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            style={({ isActive }) => ({
              ...styles.link,
              backgroundColor: isActive ? "#3b82f6" : "transparent",
              color: isActive ? "#fff" : "#cbd5e1",
            })}
          >
            {item.label}
          </NavLink>
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
  link: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 14,
    transition: "background-color 0.2s",
  },
};
