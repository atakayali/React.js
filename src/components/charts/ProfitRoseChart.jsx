import { useMemo } from "react"
import * as d3 from "d3"

export default function ProfitRoseChart({ data, darkMode, showTip, hideTip }) {
    const width = 520
    const height = 320
    const cx = width / 2
    const cy = height / 2 + 10

    const innerRadius = 0
    const outerRadius = 140
    const petalGap = 0.0 // dilimler arası boşluk
    const explode = 0 // dilimi hafif dışarı itme

    const safe = Array.isArray(data) ? data : []
    const total = d3.sum(safe, (d) => d.value)

    if (!safe.length || total <= 0) {
        return (
            <div style={{ padding: 12, color: darkMode ? "#9ca3af" : "#6b7280" }}>
                Veri yok / toplam kâr 0
            </div>
        )
    }

    const pie = useMemo(() => {
        return d3
            .pie()
            .value((d) => d.value)
            .sort(null)(safe)
    }, [safe])

    // value büyüklüğüne göre radius'u biraz esnet (petal hissi için)
    const maxV = d3.max(safe, (d) => d.value) || 1
    const rScale = d3
        .scaleLinear()
        .domain([0, maxV])
        .range([innerRadius + 25, outerRadius])

    const arc = d3
        .arc()
        .innerRadius(innerRadius)
        .outerRadius((d) => rScale(d.data.value))
        .padAngle(petalGap)
        .cornerRadius(18)

    const labelColor = darkMode ? "#e5e7eb" : "#111827"
    const stroke = darkMode ? "#0b1220" : "#ffffff"

    // renkleri basitçe index’e göre üretelim
    const color = d3
        .scaleOrdinal()
        .domain(safe.map((d) => d.name))
        .range([
            "#fb7185",
            "#60a5fa",
            "#34d399",
            "#fbbf24",
            "#a78bfa",
            "#f97316",
            "#22c55e",
            "#38bdf8",
        ])

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: "100%", height: "100%", display: "block" }}
        >

            <g transform={`translate(${cx},${cy})`}>
                {pie.map((p, i) => {
                    const mid = (p.startAngle + p.endAngle) / 2
                    const dx = Math.cos(mid) * explode
                    const dy = Math.sin(mid) * explode

                    const percent = (p.data.value / total) * 100
                    const label = `${percent.toFixed(1)}%`

                    // label pozisyonu
                    const labelArc = d3
                        .arc()
                        .innerRadius((rScale(p.data.value) + innerRadius) / 2)
                        .outerRadius((rScale(p.data.value) + innerRadius) / 2)

                    const [lx, ly] = labelArc.centroid(p)

                    return (
                        <g key={p.data.name} transform={`translate(${dx},${dy})`}>
                            <path
                                d={arc(p)}
                                fill={color(p.data.name)}
                                stroke={stroke}
                                strokeWidth={3}
                                opacity={0.95}
                                onMouseMove={(e) =>
                                    showTip?.(
                                        e,
                                        "Kâr Payı",
                                        `${p.data.name} • Kâr: ${Math.round(p.data.value).toLocaleString("tr-TR")} ₺ • Pay: ${label}`
                                    )
                                }
                                onMouseLeave={hideTip}
                                style={{ cursor: "pointer" }}
                            />

                            <text
                                x={lx}
                                y={ly + 4}
                                textAnchor="middle"
                                fontSize="13"
                                fontWeight="900"
                                fill={labelColor}
                            >
                                {label}
                            </text>

                            {/* ülke adı (dışta) */}
                            {(() => {
                                const nameArc = d3.arc().innerRadius(outerRadius + 25).outerRadius(outerRadius + 25)
                                const [nx, ny] = nameArc.centroid(p)
                                return (
                                    <text
                                        x={nx}
                                        y={ny + 4}
                                        textAnchor={nx > 0 ? "start" : "end"}
                                        fontSize="12"
                                        fontWeight="800"
                                        fill={darkMode ? "#94a3b8" : "#6b7280"}
                                    >
                                        {p.data.name}
                                    </text>
                                )
                            })()}
                        </g>
                    )
                })}
            </g>
        </svg>
    )
}
