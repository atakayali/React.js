import { useMemo } from "react"
import * as d3 from "d3"
import { motion } from "framer-motion"
import AxisLeft from "../AxisLeft"

export default function WaterfallChart({ data, showTip, hideTip, darkMode }) {
    const width = 520
    const height = 600          // ⬅️ daha yüksek
    const margin = {
        top: 8,                   // ⬅️ üstten kazanç
        right: 12,
        bottom: 32,               // ⬅️ altı çok açma
        left: 52,
    }

    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const safe = Array.isArray(data) ? data : []
    if (safe.length === 0) {
        return (
            <div style={{ padding: 12, color: darkMode ? "#9ca3af" : "#6b7280" }}>
                Veri yok
            </div>
        )
    }

    const x = useMemo(() => {
        return d3
            .scaleBand()
            .domain(safe.map((d) => d.month))
            .range([0, innerW])
            .padding(0.32)
    }, [safe, innerW])

    const y = useMemo(() => {
        const minV = d3.min(safe, (d) => Math.min(d.start, d.end, 0)) ?? 0
        const maxV = d3.max(safe, (d) => Math.max(d.start, d.end, 0)) ?? 0

        const pad = Math.max(25, Math.abs(maxV - minV) * 0.15)

        return d3
            .scaleLinear()
            .domain([minV - pad, maxV + pad])
            .nice()
            .range([innerH, 0])
    }, [safe, innerH])

    const axisColor = darkMode ? "#334155" : "#9ca3af"
    const gridColor = darkMode ? "#0f172a" : "#f3f4f6"
    const labelColor = darkMode ? "#94a3b8" : "#6b7280"
    const textColor = darkMode ? "#e5e7eb" : "#111827"

    const posFill = darkMode ? "#22c55e" : "#16a34a"
    const negFill = darkMode ? "#f87171" : "#ef4444"

    const y0 = y(0)
    const MIN_BAR_PX = 14

    return (
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
            <g transform={`translate(${margin.left},${margin.top})`}>
                {/* Grid */}
                {y.ticks(5).map((t, i) => (
                    <line key={i} x1={0} x2={innerW} y1={y(t)} y2={y(t)} stroke={gridColor} />
                ))}

                <AxisLeft scale={y} x={0} ticks={5} darkMode={darkMode} />

                {/* 0 baseline */}
                <line x1={0} x2={innerW} y1={y0} y2={y0} stroke={axisColor} opacity={0.85} />

                {/* X labels */}
                <g transform={`translate(0,${innerH})`}>
                    {safe.map((d) => {
                        const cx = (x(d.month) ?? 0) + x.bandwidth() / 2
                        return (
                            <text key={d.month} x={cx} y={28} textAnchor="middle" fontSize="12" fill={labelColor}>
                                {d.month}
                            </text>
                        )
                    })}
                </g>

                {safe.map((d, i) => {
                    const bw = x.bandwidth()
                    const xv = x(d.month) ?? 0
                    const cx = xv + bw / 2

                    const yStart = y(d.start)
                    const yEnd = y(d.end)

                    // gerçek bar
                    const topReal = Math.min(yStart, yEnd)
                    const bottomReal = Math.max(yStart, yEnd)
                    const hReal = bottomReal - topReal

                    // min-height ama seviyeyi bozmadan: real midpoint etrafında büyüt
                    const mid = (yStart + yEnd) / 2
                    const barH = Math.max(hReal, MIN_BAR_PX)
                    const barTop = mid - barH / 2

                    const fill = d.diff >= 0 ? posFill : negFill

                    // connector çizgisi: ayın end seviyesinde
                    const next = safe[i + 1]
                    const yConn = yEnd

                    const diffText = d.diff >= 0 ? `+${d.diff}` : `${d.diff}`

                    // diff etiketi: bar küçükse üstüne, büyükse içine
                    const diffInside = barH >= 22
                    const diffY = diffInside ? (barTop + barH / 2 + 4) : (barTop - 8)

                    // kümülatif etiketi end'e göre üst/alt
                    const cumY = d.diff >= 0 ? (yEnd - 10) : (yEnd + 18)

                    return (
                        <g key={d.month}>
                            {/* connector */}
                            {next && (
                                <line
                                    x1={cx}
                                    x2={(x(next.month) ?? 0) + bw / 2}
                                    y1={yConn}
                                    y2={yConn}
                                    stroke={axisColor}
                                    opacity={0.35}
                                />
                            )}

                            {/* BAR (scaleY yok! y/height animasyonu var) */}
                            <motion.rect
                                x={xv}
                                rx="10"
                                ry="10"
                                fill={fill}
                                stroke={darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)"}
                                strokeWidth={1}
                                initial={{ y: barTop + barH / 2, height: 0, opacity: 0 }}
                                animate={{ y: barTop, height: barH, opacity: 1 }}
                                transition={{ duration: 0.55, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                                width={bw}
                                onMouseMove={(e) =>
                                    showTip?.(e, "Kümülatif Fark", `${d.month} | Fark: ${d.diff} | Küm: ${d.end}`)
                                }
                                onMouseLeave={hideTip}
                            />

                            {/* diff etiketi */}
                            <text
                                x={cx}
                                y={diffY}
                                textAnchor="middle"
                                fontSize="13"
                                fontWeight="900"
                                fill={diffInside ? "#ffffff" : textColor}
                            >
                                {diffText}
                            </text>

                            {/* kümülatif etiketi */}
                            <text
                                x={cx}
                                y={cumY}
                                textAnchor="middle"
                                fontSize="9"
                                fontWeight="900"
                                fill={textColor}
                            >
                                {d.end}
                            </text>
                        </g>
                    )
                })}
            </g>
        </svg>
    )
}
