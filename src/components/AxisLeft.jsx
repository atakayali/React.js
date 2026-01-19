import { motion } from "framer-motion"

export default function AxisLeft({ scale, x, ticks = 5, darkMode }) {
    const values = scale.ticks(ticks)
    const axisColor = darkMode ? "#334155" : "#9ca3af"
    const textColor = darkMode ? "#94a3b8" : "#6b7280"

    return (
        <g>
            <line x1={x} y1={0} x2={x} y2={scale.range()[0]} stroke={axisColor} />
            {values.map((t, i) => {
                const y = scale(t)
                return (
                    <g key={i} transform={`translate(${x},${y})`}>
                        <line x1="-6" x2="0" stroke={axisColor} />
                        <text
                            x={-10}
                            dy="0.32em"
                            textAnchor="end"
                            fontSize="12"
                            fill={textColor}
                        >
                            {t}
                        </text>
                    </g>
                )
            })}
        </g>
    )
}
