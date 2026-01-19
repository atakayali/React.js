export default function Chip({ text, darkMode }) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "6px 10px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 800,
                border: `1px solid ${darkMode ? "#1f2937" : "#e5e7eb"}`,
                background: darkMode ? "#0b1220" : "#ffffff",
                color: darkMode ? "#e5e7eb" : "#111827",
            }}
        >
            {text}
        </span>
    )
}
