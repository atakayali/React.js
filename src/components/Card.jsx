import { motion } from "framer-motion"
import { ease } from "../utils/constants"

export default function Card({ title, children, darkMode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease }}
            whileHover={{ y: -5 }}
            style={{
                height: "100%",
                minHeight: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                border: `1px solid ${darkMode ? "#2d3c52ff" : "#e5e7eb"}`,
                borderRadius: 14,
                padding: 16,
                background: darkMode ? "#132345ff" : "#ffffff",
                boxShadow: darkMode
                    ? "0 8px 20px rgba(236, 26, 26, 0.35)"
                    : "0 8px 18px rgba(50, 197, 121, 0.1)",
            }}
        >
            <div style={{ fontWeight: 800, marginBottom: 10 }}>{title}</div>
            <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
        </motion.div>
    )
}
