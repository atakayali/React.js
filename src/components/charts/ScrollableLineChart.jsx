import { useMemo } from "react"
import * as d3 from "d3"
import AxisLeft from "../AxisLeft"

export default function ScrollableLineChart({ data, showTip, hideTip, darkMode }) {
    const height = 260
    const margin = { top: 10, right: 16, bottom: 40, left: 48 }
    const innerH = height - margin.top - margin.bottom

    const days = useMemo(
        () => Array.from({ length: 30 }, (_, i) => String(i + 1).padStart(2, "0")),
        []
    )

    const safeData = Array.isArray(data) ? data : []
    if (safeData.length === 0) {
        return (
            <div style={{ padding: 12, color: darkMode ? "#9ca3af" : "#6b7280" }}>
                Veri yok
            </div>
        )
    }

    const innerW = Math.max(520 - margin.left - margin.right, days.length * 28)
    const width = innerW + margin.left + margin.right

    const valueByDay = useMemo(() => {
        const m = new Map()
        for (const d of safeData) {
            if (d?.day != null)
                m.set(String(d.day).padStart(2, "0"), Number(d.value) || 0)
        }
        return m
    }, [safeData])

    const series = useMemo(
        () => days.map((day) => ({ day, value: valueByDay.get(day) ?? 0 })),
        [days, valueByDay]
    )

    const x = useMemo(
        () =>
            d3
                .scalePoint()
                .domain(days)
                .range([0, innerW])
                .padding(0.5),
        [days, innerW]
    )

    const y = useMemo(() => {
        const maxY = d3.max(series, (d) => d.value) ?? 0
        return d3.scaleLinear().domain([0, maxY]).nice().range([innerH, 0])
    }, [series, innerH])

    const linePath = useMemo(() => {
        return (
            d3
                .line()
                .x((d) => x(d.day) ?? 0)
                .y((d) => y(d.value))
                .curve(d3.curveMonotoneX)(series) || ""
        )
    }, [series, x, y])

    const axisColor = darkMode ? "#334155" : "#9ca3af"
    const labelColor = darkMode ? "#94a3b8" : "#6b7280"
    const stroke = darkMode ? "#34d399" : "#10b981"

    return (
        <div
            style={{
                width: "100%",
                overflowX: "auto",
                overflowY: "hidden",
                paddingBottom: 6,
            }}
        >
            <svg
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="xMinYMid meet"
                style={{ display: "block", width, height: "auto" }}
            >
                <g transform={`translate(${margin.left},${margin.top})`}>
                    <AxisLeft scale={y} x={0} ticks={5} darkMode={darkMode} />

                    <g transform={`translate(0,${innerH})`}>
                        <line x1={0} y1={0} x2={innerW} y2={0} stroke={axisColor} />
                        {series.map((d, i) => {
                            const showLabel = i % 5 === 0 || i === series.length - 1
                            if (!showLabel) return null
                            const cx = x(d.day) ?? 0
                            return (
                                <text
                                    key={d.day}
                                    x={cx}
                                    y={24}
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill={labelColor}
                                >
                                    {d.day}
                                </text>
                            )
                        })}
                    </g>

                    <path
                        d={linePath}
                        fill="none"
                        stroke={stroke}
                        strokeWidth="3"
                        strokeLinecap="round"
                    />

                    {series.map((d) => {
                        const cx = x(d.day) ?? 0
                        const cy = y(d.value)
                        return (
                            <circle
                                key={d.day}
                                cx={cx}
                                cy={cy}
                                r={4}
                                fill={stroke}
                                onMouseMove={(e) =>
                                    showTip?.(e, "30 Gün Sipariş", `${d.day}. gün: ${d.value}`)
                                }
                                onMouseLeave={hideTip}
                            />
                        )
                    })}
                </g>
            </svg>
        </div>
    )
}
