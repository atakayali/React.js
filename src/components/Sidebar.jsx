import { motion } from "framer-motion"

export default function Sidebar({
    activeTab,
    setActiveTab,
    darkMode,
    toggleDarkMode,
    isOpen,
    toggleSidebar
}) {
    const menuItems = [
        { id: "dashboard", label: "📊 Dashboard", color: "#3b82f6" },
        { id: "analytics", label: "📈 Analizler", color: "#8b5cf6" },
        { id: "reports", label: "📄 Raporlar", color: "#10b981" },
        { id: "settings", label: "⚙️ Ayarlar", color: "#6b7280" },
    ]

    return (
        <motion.div
            initial={{ x: -280 }}
            animate={{ x: isOpen ? 0 : -280 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{
                width: 260,
                height: "100vh",
                position: "fixed",
                left: 0,
                top: 0,
                display: "flex",
                flexDirection: "column",
                background: darkMode ? "#0f172a" : "#ffffff",
                borderRight: `1px solid ${darkMode ? "#1f2937" : "#e5e7eb"}`,
                padding: 20,
                zIndex: 100,
                overflow: "hidden",
                boxShadow: isOpen ? "4px 0 24px rgba(0,0,0,0.15)" : "none"
            }}
        >
            {/* Close Button (Optional, visual cue) */}
            <div
                onClick={toggleSidebar}
                style={{
                    position: "absolute",
                    right: 16,
                    top: 16,
                    cursor: "pointer",
                    color: darkMode ? "#94a3b8" : "#64748b",
                    fontSize: 20
                }}
            >
                ✕
            </div>

            {/* Logo / Brand */}
            <div style={{ marginBottom: 40, marginTop: 10 }}>
                <motion.div>
                    <h1 style={{
                        fontSize: 24,
                        fontWeight: 900,
                        background: "linear-gradient(to right, #3b82f6, #8b5cf6)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        margin: 0,
                        whiteSpace: "nowrap"
                    }}>
                        AdminPanel
                    </h1>
                    <span style={{ fontSize: 12, color: darkMode ? "#94a3b8" : "#6b7280", fontWeight: 600 }}>v2.4.0 (Pro)</span>
                </motion.div>
            </div>

            {/* Menu */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                {menuItems.map((item) => {
                    const isActive = activeTab === item.id
                    return (
                        <motion.div
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                padding: "12px 16px",
                                borderRadius: 12,
                                cursor: "pointer",
                                background: isActive
                                    ? (darkMode ? "rgba(59, 130, 246, 0.15)" : "#eff6ff")
                                    : "transparent",
                                color: isActive
                                    ? (darkMode ? "#60a5fa" : "#2563eb")
                                    : (darkMode ? "#94a3b8" : "#4b5563"),
                                fontWeight: isActive ? 700 : 500,
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                transition: "all 0.2s ease"
                            }}
                        >
                            <span style={{ fontSize: 20 }}>{item.label.split(" ")[0]}</span>
                            <span>{item.label.split(" ").slice(1).join(" ")}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="active-pill"
                                    style={{
                                        marginLeft: "auto",
                                        width: 6,
                                        height: 6,
                                        borderRadius: "50%",
                                        background: item.color
                                    }}
                                />
                            )}
                        </motion.div>
                    )
                })}
            </div>

            {/* Footer / Dark Mode Toggle */}
            <div style={{ marginTop: "auto" }}>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={toggleDarkMode}
                    style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: 12,
                        border: `1px solid ${darkMode ? "#334155" : "#e5e7eb"}`,
                        cursor: "pointer",
                        background: darkMode ? "#1e293b" : "#f3f4f6",
                        color: darkMode ? "#f9fafb" : "#111827",
                        fontWeight: 600,
                        fontSize: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8
                    }}
                >
                    {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
                </motion.button>

                <div style={{ marginTop: 16, textAlign: "center", fontSize: 11, color: darkMode ? "#475569" : "#9ca3af" }}>
                    © 2026 Company<br />All rights reserved.
                </div>
            </div>
        </motion.div>
    )
}
