import { useMemo } from "react"
import * as d3 from "d3"
import AxisLeft from "../AxisLeft"

export default function ScatterChart({ data, showTip, hideTip, darkMode }) {
    const width = 420
    const height = 260
    const margin = { top: 10, right: 20, bottom: 40, left: 50 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const safeData = Array.isArray(data) ? data : []

    const x = useMemo(() => {
        const maxX = d3.max(safeData, (d) => d.x) ?? 0
        return d3
            .scaleLinear()
            .domain([0, maxX])
            .nice()
            .range([0, innerW])
    }, [safeData, innerW])

    const y = useMemo(() => {
        const minY = d3.min(safeData, (d) => d.y) ?? 0
        const maxY = d3.max(safeData, (d) => d.y) ?? 0
        return d3
            .scaleLinear()
            .domain([minY, maxY])
            .nice()
            .range([innerH, 0])
    }, [safeData, innerH])

    const axisColor = darkMode ? "#334155" : "#9ca3af"
    const labelColor = darkMode ? "#94a3b8" : "#6b7280"
    const pointColor = darkMode ? "#f472b6" : "#ec4899"
    const gridColor = darkMode ? "#0f172a" : "#f3f4f6"

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: "100%", height: "100%", display: "block" }}
        >
            <g transform={`translate(${margin.left},${margin.top})`}>
                {/* Grid */}
                {y.ticks(5).map((t, i) => (
                    <line
                        key={i}
                        x1={0}
                        x2={innerW}
                        y1={y(t)}
                        y2={y(t)}
                        stroke={gridColor}
                    />
                ))}

                {/* Y Axis */}
                <AxisLeft scale={y} x={0} ticks={5} darkMode={darkMode} />

                {/* X Axis */}
                <g transform={`translate(0,${innerH})`}>
                    <line x1={0} x2={innerW} stroke={axisColor} />
                    {x.ticks(5).map((t, i) => (
                        <g key={i} transform={`translate(${x(t)},0)`}>
                            <line y2="6" stroke={axisColor} />
                            <text
                                y={20}
                                textAnchor="middle"
                                fontSize="11"
                                fill={labelColor}
                            >
                                {t}
                            </text>
                        </g>
                    ))}
                </g>

                {/* Points */}
                {safeData.map((d, i) => (
                    <circle
                        key={`${d.month}-${i}`}
                        cx={x(d.x)}
                        cy={y(d.y)}
                        r={6}
                        fill={pointColor}
                        opacity={0.85}
                        onMouseMove={(e) =>
                            showTip(
                                e,
                                "Aylık Karşılaştırma",
                                `${d.month} | Üretim: ${d.production} | Sipariş: ${d.orders} | Fark: ${d.y}`
                            )
                        }
                        onMouseLeave={hideTip}
                    >
                        <animate
                            attributeName="r"
                            from="0"
                            to="6"
                            dur="0.35s"
                            begin={`${i * 0.05}s`}
                            fill="freeze"
                        />
                    </circle>
                ))}
            </g>
        </svg>
    )
}
