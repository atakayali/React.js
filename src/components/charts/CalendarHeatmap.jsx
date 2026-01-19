import { useMemo } from "react"
import * as d3 from "d3"
import { motion } from "framer-motion"

export default function CalendarHeatmap({ darkMode, showTip, hideTip }) {
    // Demo Data: Generate 365 days of random values
    const data = useMemo(() => {
        const arr = []
        const startDate = new Date(2025, 0, 1) // Jan 1 2025
        for (let i = 0; i < 365; i++) {
            const d = new Date(startDate)
            d.setDate(d.getDate() + i)

            // Random value with some seasonality (more in summer)
            const month = d.getMonth()
            const seasonality = month > 4 && month < 8 ? 20 : 0
            const value = Math.max(0, Math.floor(Math.random() * 50) + seasonality + (Math.random() > 0.9 ? 40 : 0))

            arr.push({ date: d, value })
        }
        return arr
    }, [])

    const width = 520
    const cellSize = 11
    const cellGap = 3
    const height = 140

    // Group by Week
    const weekGroups = useMemo(() => {
        const groups = []
        let currentWeek = []

        data.forEach((d, i) => {
            const dayOfWeek = d.date.getDay() // 0 (Sun) - 6 (Sat)
            // Adjust to start Monday (optional, default 0=Sun is fine for simple view)

            currentWeek.push({ ...d, dayIndex: dayOfWeek })

            if (dayOfWeek === 6 || i === data.length - 1) {
                groups.push(currentWeek)
                currentWeek = []
            }
        })
        return groups
    }, [data])

    // Color Scale
    const maxVal = d3.max(data, d => d.value) || 1
    const colorScale = d3.scaleSequential()
        .domain([0, maxVal])
        .interpolator(darkMode ? d3.interpolateInferno : d3.interpolateGreens)

    const emptyColor = darkMode ? "#1f2937" : "#e5e7eb"

    return (
        <div style={{ width: "100%", overflowX: "auto", paddingBottom: 10 }}>
            <svg width={weekGroups.length * (cellSize + cellGap) + 40} height={height}>
                <g transform="translate(30, 20)">
                    {/* Week Labels (Months) - Simplified logic: Label every ~4 weeks */}
                    {weekGroups.map((week, i) => {
                        const firstDay = week[0].date
                        const showLabel = firstDay.getDate() <= 7
                        if (!showLabel) return null
                        return (
                            <text
                                key={`label-${i}`}
                                x={i * (cellSize + cellGap)}
                                y={-8}
                                fontSize={10}
                                fill={darkMode ? "#9ca3af" : "#6b7280"}
                            >
                                {firstDay.toLocaleString('default', { month: 'short' })}
                            </text>
                        )
                    })}

                    {/* Day Labels */}
                    {["Mon", "Wed", "Fri"].map((d, i) => (
                        <text
                            key={d}
                            x={-6}
                            y={(i * 2 + 1) * (cellSize + cellGap) + 8}
                            textAnchor="end"
                            fontSize={10}
                            fill={darkMode ? "#64748b" : "#94a3b8"}
                        >
                            {d}
                        </text>
                    ))}

                    {/* Cells */}
                    {weekGroups.map((week, weekIndex) => (
                        <g key={weekIndex} transform={`translate(${weekIndex * (cellSize + cellGap)}, 0)`}>
                            {week.map((day) => (
                                <motion.rect
                                    key={day.date.toISOString()}
                                    y={day.dayIndex * (cellSize + cellGap)}
                                    width={cellSize}
                                    height={cellSize}
                                    rx={2}
                                    fill={day.value === 0 ? emptyColor : colorScale(day.value)}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: weekIndex * 0.01 + day.dayIndex * 0.02 }}
                                    onMouseMove={(e) =>
                                        showTip?.(
                                            e,
                                            "Günlük Aktivite",
                                            `${day.date.toLocaleDateString()} • Satış: ${day.value}`
                                        )
                                    }
                                    onMouseLeave={hideTip}
                                />
                            ))}
                        </g>
                    ))}
                </g>
            </svg>
        </div>
    )
}
