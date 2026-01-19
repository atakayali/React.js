import * as d3 from "d3"

export default function FunnelChart({ data, darkMode, showTip, hideTip, title = "Top Countries by Total Sales" }) {
    const width = 520
    const height = 320

    const leftPad = 14
    const rightPad = 14
    const topPad = 22
    const bottomPad = 18

    const funnelW = 300 // sol taraftaki huni genişliği
    const labelX = funnelW + 25 // sağdaki label başlangıcı

    const innerW = width - leftPad - rightPad
    const innerH = height - topPad - bottomPad

    const safe = Array.isArray(data) ? data.slice(0, 6) : []
    if (!safe.length) {
        return (
            <div style={{ padding: 12, color: darkMode ? "#9ca3af" : "#6b7280" }}>
                Veri yok
            </div>
        )
    }

    const maxV = d3.max(safe, (d) => d.value) || 1

    // Üst genişlik max, alta indikçe daralır (min %30)
    const wScale = d3
        .scaleLinear()
        .domain([0, maxV])
        .range([funnelW * 0.32, funnelW])

    const rowH = innerH / safe.length

    const stroke = darkMode ? "#050b16" : "#ffffff"
    const textMain = darkMode ? "#e5e7eb" : "#111827"
    const textSub = darkMode ? "#94a3b8" : "#6b7280"

    // görseldeki gibi soft renkler
    const colors = ["#0f766e", "#60a5fa", "#fdba74", "#1d4ed8", "#86efac", "#fb7185"]

    const fmt = (v) => {
        // 457.69k gibi gösterim
        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
        if (v >= 1_000) return `${(v / 1_000).toFixed(2)}k`
        return String(Math.round(v))
    }

    return (
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
            <g transform={`translate(${leftPad},${topPad})`}>
                {/* Başlık */}
                <text x={0} y={-6} fontSize="14" fontWeight="900" fill={textMain}>
                    {title}
                </text>
                <text x={0} y={14} fontSize="11" fontWeight="700" fill={textSub}>
                    Hover over the chart to see the details.
                </text>

                {safe.map((d, i) => {
                    const topW = wScale(d.value)
                    const nextV = safe[i + 1]?.value ?? 0
                    const botW = i === safe.length - 1 ? wScale(d.value) * 0.85 : wScale(nextV)

                    const y0 = 36 + i * rowH
                    const y1 = 36 + (i + 1) * rowH

                    const cx = funnelW / 2

                    // trapez noktaları
                    const xTL = cx - topW / 2
                    const xTR = cx + topW / 2
                    const xBL = cx - botW / 2
                    const xBR = cx + botW / 2

                    const path = `M ${xTL} ${y0}
                        L ${xTR} ${y0}
                        L ${xBR} ${y1}
                        L ${xBL} ${y1}
                        Z`

                    const fill = colors[i % colors.length]

                    // değer metni segmentin ortasında
                    const midY = (y0 + y1) / 2 + 5

                    return (
                        <g key={d.name}>
                            <path
                                d={path}
                                fill={fill}
                                stroke={stroke}
                                strokeWidth={4}
                                opacity={0.95}
                                onMouseMove={(e) =>
                                    showTip?.(
                                        e,
                                        "Toplam Satış",
                                        `${d.name} • ${Math.round(d.value).toLocaleString("tr-TR")} ₺ (${fmt(d.value)})`
                                    )
                                }
                                onMouseLeave={hideTip}
                                style={{ cursor: "pointer" }}
                            />

                            <text
                                x={cx}
                                y={midY}
                                textAnchor="middle"
                                fontSize="13"
                                fontWeight="900"
                                fill={textMain}
                            >
                                {fmt(d.value)}
                            </text>

                            {/* sağdaki label */}
                            <text
                                x={labelX}
                                y={midY}
                                textAnchor="start"
                                fontSize="12"
                                fontWeight="800"
                                fill={textSub}
                            >
                                {d.name}
                            </text>
                        </g>
                    )
                })}
            </g>
        </svg>
    )
}
