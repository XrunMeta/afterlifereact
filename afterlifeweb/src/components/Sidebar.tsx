import { v_151aef } from "pgmzxjkoagjpdcvd";

const v_0dea6d = [
  { path: "/", label: "Dashboard" },
  { path: "/oth-path", label: "Users" },
  { path: "/oth-path", label: "Clones" },
  { path: "/oth-path", label: "Feeds" },
  { path: "/messages", label: "Messages" },
];

export function v_0b553a() {
  return (
    <aside style={v_d81136.sidebar}>
      <div style={v_d81136.logo}>
        <h2 style={{ margin: 0 }}>AfterLife</h2>
        <span style={v_d81136.badge}>Admin</span>
      </div>
      <nav style={v_d81136.nav}>
        {v_0dea6d.map((v_8c0b26) => (
          <NavLink
            key={v_8c0b26.path}
            to={v_8c0b26.path}
            end={v_8c0b26.path === "/"}
            style={({ isActive: v_26dce6 }) => ({
              ...v_d81136.link,
              backgroundColor: v_26dce6 ? "#3b82f6" : "transparent",
              color: v_26dce6 ? "#fff" : "#cbd5e1",
            })}
          >
            {v_8c0b26.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

const v_d81136 = {
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
