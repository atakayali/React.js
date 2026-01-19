import { useRef, useEffect, useMemo } from "react"
import * as d3 from "d3"

export default function CarStorageChart({ current, capacity, selectedModel, darkMode, showTip, hideTip }) {
    const val = Number(current) || 0
    const cap = Number(capacity) || 1
    const percentage = Math.min(100, Math.max(0, (val / cap) * 100))

    const carPath = useMemo(() => {
        const m = (selectedModel || "").toLowerCase()
        const chassis = "L195,80 A15,15 0 0,1 165,80 L55,80 A15,15 0 0,1 25,80 L10,80 Z"

        // SUV: Taller, Boxier
        if (m.includes("suv") || m.includes("t10x"))
            return "M10,50 L25,50 L30,35 L50,35 L55,10 L155,10 L165,35 L205,35 L210,50 L215,50 L215,80 " + chassis

        // Hatchback: Short rear overhang, steep back
        if (m.includes("hatchback"))
            return "M10,50 L25,50 L30,35 L50,35 L60,15 L130,15 L140,35 L185,35 L190,50 L205,50 L205,80 " + chassis

        // Van (Ticari): Boxy front and back
        if (m.includes("ticari") || m.includes("van"))
            return "M10,50 L15,50 L20,35 L25,15 L175,15 L180,50 L215,50 L215,80 " + chassis

        // Default (Sedan / EV): Sleek
        return "M10,50 L25,50 L30,35 L50,35 L60,15 L140,15 L160,35 L190,35 L195,50 L210,50 L210,80 " + chassis
    }, [selectedModel])
    // Wheels (optional, drawn separately or part of path)

    // Unique ID for gradient (stable across re-renders)
    const gradId = useMemo(() => `carFillGrad-${Math.random().toString(36).substr(2, 9)}`, [])

    return (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <svg
                viewBox="0 0 220 100"
                style={{ width: "80%", maxHeight: 180, overflow: "visible" }}
                onMouseMove={(e) => showTip(e, "Stok Durumu", `Mevcut: ${current} / Kapasite: ${capacity} (%${percentage.toFixed(1)})`)}
                onMouseLeave={hideTip}
            >
                <defs>
                    <linearGradient id={gradId} x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset={`${percentage}%`} stopColor="#ef4444" /> {/* Red Fill */}
                        <stop offset={`${percentage}%`} stopColor={darkMode ? "#334155" : "#e2e8f0"} /> {/* Empty part */}
                    </linearGradient>
                </defs>

                {/* Car Shape */}
                <path
                    d={carPath}
                    fill={`url(#${gradId})`}
                    stroke={darkMode ? "#94a3b8" : "#475569"}
                    strokeWidth="2"
                />

                {/* Wheels */}
                <circle cx="40" cy="80" r="12" fill={darkMode ? "#1e293b" : "#333"} stroke={darkMode ? "#94a3b8" : "#475569"} strokeWidth="2" />
                <circle cx="180" cy="80" r="12" fill={darkMode ? "#1e293b" : "#333"} stroke={darkMode ? "#94a3b8" : "#475569"} strokeWidth="2" />

                {/* Percentage Text */}
                <text
                    x="110"
                    y="60"
                    textAnchor="middle"
                    fill={percentage > 50 ? "#fff" : (darkMode ? "#fff" : "#333")}
                    fontSize="24"
                    fontWeight="bold"
                    style={{ pointerEvents: "none" }}
                >
                    %{percentage.toFixed(0)}
                </text>
            </svg>

            <div style={{ marginTop: 16, textAlign: "center", color: darkMode ? "#cbd5e1" : "#475569" }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Stok Doluluk Oranı</div>
                <div style={{ fontSize: 14 }}>{current.toLocaleString()} / {capacity.toLocaleString()} Araç</div>
            </div>
        </div>
    )
}
