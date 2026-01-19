import { useMemo } from "react"
import * as d3 from "d3"
import { motion } from "framer-motion"
import { ease } from "../../utils/constants"
import AxisLeft from "../AxisLeft"

export default function BarChart({
    data,
    xKey,
    yKey,
    showTip,
    hideTip,
    darkMode,
    hoverIndex,
    setHoverIndex,
}) {

    const width = 520
    const height = 260
    const margin = { top: 10, right: 16, bottom: 40, left: 48 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const x = useMemo(
        () =>
            d3
                .scaleBand()
                .domain(data.map((d) => d[xKey]))
                .range([0, innerW])
                .padding(0.25),
        [data, xKey, innerW]
    )

    const y = useMemo(() => {
        const maxY = d3.max(data, (d) => d[yKey]) ?? 0
        return d3.scaleLinear().domain([0, maxY]).nice().range([innerH, 0])
    }, [data, yKey, innerH])

    const axisColor = darkMode ? "#334155" : "#9ca3af"
    const labelColor = darkMode ? "#94a3b8" : "#6b7280"
    const barFill = darkMode ? "#93c5fd" : "#93c5fd"      // soluk mavi
    const barFillActive = darkMode ? "#3b82f6" : "#2563eb" // canlı mavi
    const gridColor = darkMode ? "#0f172a" : "#f3f4f6"

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: "100%", height: "auto" }}
        >
            <g transform={`translate(${margin.left},${margin.top})`}>
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
                        />
                    )
                })}

                <AxisLeft scale={y} x={0} ticks={5} darkMode={darkMode} />

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
                                fontSize="12"
                                fill={labelColor}
                            >
                                {label}
                            </text>
                        )
                    })}
                </g>

                {data.map((d, i) => {
                    const label = d[xKey]
                    const value = d[yKey]
                    const xv = x(label) ?? 0
                    const yv = y(value)
                    const h = innerH - yv

                    return (
                        <motion.rect
                            key={i}
                            x={xv}
                            width={x.bandwidth()}
                            rx="8"
                            ry="8"
                            fill={hoverIndex === i ? barFillActive : barFill}
                            initial={{ y: innerH, height: 0, opacity: 0.85 }}
                            animate={{ y: yv, height: h, opacity: 1 }}
                            transition={{ duration: 0.7, ease, delay: i * 0.04 }}
                            whileHover={{ opacity: 1 }}
                            onMouseEnter={() => setHoverIndex?.(i)}
                            onMouseMove={(e) => showTip(e, "Aylık Üretim", `${label}: ${value}`)}
                            onMouseLeave={() => {
                                setHoverIndex?.(null)
                                hideTip?.()
                            }}
                        />
                    )
                })}
            </g>
        </svg>
    )
}
