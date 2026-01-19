import { useMemo } from "react"
import * as d3 from "d3"
import { motion } from "framer-motion"
import { ease } from "../../utils/constants"
import AxisLeft from "../AxisLeft"

export default function ComboChart({
    data,
    barKey = "profit",
    lineKey = "target",
    xKey = "month",
    showTip,
    hideTip,
    darkMode,
}) {
    const width = 520
    const height = 260
    const margin = { top: 20, right: 50, bottom: 40, left: 55 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    // X Scale - Band
    const x = useMemo(
        () =>
            d3
                .scaleBand()
                .domain(data.map((d) => d[xKey]))
                .range([0, innerW])
                .padding(0.3),
        [data, xKey, innerW]
    )

    // Y Scale - shared for both bar and line
    const y = useMemo(() => {
        const allValues = data.flatMap((d) => [d[barKey], d[lineKey]])
        const maxY = d3.max(allValues) ?? 0
        return d3.scaleLinear().domain([0, maxY * 1.1]).nice().range([innerH, 0])
    }, [data, barKey, lineKey, innerH])

    // Line generator
    const lineGen = useMemo(
        () =>
            d3
                .line()
                .x((d) => (x(d[xKey]) ?? 0) + x.bandwidth() / 2)
                .y((d) => y(d[lineKey]))
                .curve(d3.curveMonotoneX),
        [x, y, xKey, lineKey]
    )

    const linePath = lineGen(data)

    // Colors
    const axisColor = darkMode ? "#334155" : "#9ca3af"
    const labelColor = darkMode ? "#94a3b8" : "#6b7280"
    const gridColor = darkMode ? "#0f172a" : "#f3f4f6"
    const barFill = darkMode ? "#22c55e" : "#22c55e"         // Yeşil - kâr
    const barFillHover = darkMode ? "#16a34a" : "#15803d"
    const lineColor = darkMode ? "#f59e0b" : "#f59e0b"       // Turuncu - hedef

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: "100%", height: "auto" }}
        >
            <g transform={`translate(${margin.left},${margin.top})`}>
                {/* Grid Lines */}
                {y.ticks(5).map((t, i) => {
                    const yy = y(t)
                    return (
                        <line
                            key={i}
                            x1={0}
                            x2={innerW}
                            y1={yy}
                            y2={yy}
                            stroke={gridColor}
                            strokeDasharray="4,4"
                        />
                    )
                })}

                {/* Left Axis */}
                <AxisLeft scale={y} x={0} ticks={5} darkMode={darkMode} />

                {/* X Axis */}
                <g transform={`translate(0,${innerH})`}>
                    <line x1={0} y1={0} x2={innerW} y2={0} stroke={axisColor} />
                    {data.map((d, i) => {
                        const label = d[xKey]
                        const cx = (x(label) ?? 0) + x.bandwidth() / 2
                        return (
                            <text
                                key={i}
                                x={cx}
                                y={24}
                                textAnchor="middle"
                                fontSize="11"
                                fill={labelColor}
                            >
                                {label}
                            </text>
                        )
                    })}
                </g>

                {/* Bars - Brüt Kâr */}
                {data.map((d, i) => {
                    const label = d[xKey]
                    const value = d[barKey]
                    const xv = x(label) ?? 0
                    const yv = y(value)
                    const h = innerH - yv

                    return (
                        <motion.rect
                            key={i}
                            x={xv}
                            width={x.bandwidth()}
                            rx="6"
                            ry="6"
                            fill={barFill}
                            initial={{ y: innerH, height: 0, opacity: 0.85 }}
                            animate={{ y: yv, height: h, opacity: 0.9 }}
                            transition={{ duration: 0.6, ease, delay: i * 0.05 }}
                            whileHover={{ opacity: 1, fill: barFillHover }}
                            onMouseMove={(e) =>
                                showTip(e, `${label} Brüt Kâr`, `₺${Math.round(value).toLocaleString("tr-TR")}`)
                            }
                            onMouseLeave={hideTip}
                            style={{ cursor: "pointer" }}
                        />
                    )
                })}

                {/* Line - Hedef */}
                <motion.path
                    d={linePath}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={3}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.2, ease }}
                />

                {/* Line Points */}
                {data.map((d, i) => {
                    const cx = (x(d[xKey]) ?? 0) + x.bandwidth() / 2
                    const cy = y(d[lineKey])
                    return (
                        <motion.circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r={6}
                            fill={lineColor}
                            stroke={darkMode ? "#0b1220" : "#fff"}
                            strokeWidth={2}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.8 + i * 0.05 }}
                            whileHover={{ scale: 1.3 }}
                            onMouseMove={(e) =>
                                showTip(e, `${d[xKey]} Hedef`, `₺${Math.round(d[lineKey]).toLocaleString("tr-TR")}`)
                            }
                            onMouseLeave={hideTip}
                            style={{ cursor: "pointer" }}
                        />
                    )
                })}

                {/* Legend */}
                <g transform={`translate(${innerW - 140}, -10)`}>
                    <rect x={0} y={0} width={12} height={12} fill={barFill} rx={3} />
                    <text x={18} y={10} fontSize="11" fill={labelColor}>Brüt Kâr</text>
                    <rect x={75} y={0} width={12} height={12} fill={lineColor} rx={3} />
                    <text x={93} y={10} fontSize="11" fill={labelColor}>Hedef</text>
                </g>
            </g>
        </svg>
    )
}
