import { motion } from "framer-motion"
import { ease } from "../utils/constants"

export default function KPI({ label, value, darkMode, target, trend, formatValue }) {
    // Simple trend logic: if trend > 0 positive (green), else negative (red)
    // You can customize logic (e.g. for cost, negative might be good)
    const isPositive = trend >= 0
    const trendColor = isPositive ? (darkMode ? "#4ade80" : "#16a34a") : (darkMode ? "#f87171" : "#dc2626")
    const trendArrow = isPositive ? "↗" : "↘"

    // Progress logic
    const progress = target ? Math.min(100, Math.max(0, (value / target) * 100)) : 0

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.99 }}
            style={{
                background: darkMode ? "#0b1220" : "#fff",
                border: `1px solid ${darkMode ? "#1f2937" : "#e5e7eb"}`,
                borderRadius: 14,
                padding: "16px 20px",
                boxShadow: darkMode
                    ? "0 8px 18px rgba(0,0,0,0.35)"
                    : "0 8px 18px rgba(0,0,0,0.10)",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minWidth: 180,
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: darkMode ? "#9ca3af" : "#6b7280" }}>
                    {label}
                </div>

                {/* Trend Indicator */}
                {trend !== undefined && (
                    <div style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: trendColor,
                        background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                        padding: "2px 6px",
                        borderRadius: 6,
                    }}>
                        {trendArrow} {Math.abs(trend)}%
                    </div>
                )}
            </div>

            <div style={{ fontSize: 24, fontWeight: 900, marginBottom: target ? 8 : 0 }}>
                {formatValue ? formatValue(value) : value}
            </div>

            {/* Target Progress Bar */}
            {target > 0 && (
                <div style={{ marginTop: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4, color: darkMode ? "#64748b" : "#9ca3af" }}>
                        <span>Hedef: {formatValue ? formatValue(target) : target}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div style={{
                        width: "100%",
                        height: 6,
                        background: darkMode ? "#1f2937" : "#f3f4f6",
                        borderRadius: 999
                    }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                            style={{
                                height: "100%",
                                background: darkMode ? "#3b82f6" : "#2563eb",
                                borderRadius: 999,
                            }}
                        />
                    </div>
                </div>
            )}
        </motion.div>
    )
}
