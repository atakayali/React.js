import { useState, useCallback } from "react"
import { ComposableMap, Geographies, Geography, ZoomableGroup, Line } from "react-simple-maps"
import { normalizeName, clamp } from "../utils/helpers"
import { sample } from "../data/sampleData"

export default function WorldMapHighlight({
    selectedCountry,
    darkMode,
    showTip,
    hideTip,
    onSelectCountry,
}) {
    const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

    // Harita (EN) -> senin data (TR)
    const mapToTR = {
        Turkey: "Türkiye",
        Germany: "Almanya",
        Sweden: "İsveç",
        France: "Fransa",
        Netherlands: "Hollanda",
    }
    const selectableTR = ["Türkiye", "Almanya", "İsveç", "Fransa", "Hollanda"]

    const baseSelectableFill = darkMode ? "#1f2937" : "#39b417"   // 5 ülkenin normal rengi
    const baseOtherFill = darkMode ? "#70614e" : "#0c236d"        // diğer ülkeler
    const hoverSelectableFill = darkMode ? "#334155" : "#a5b4fc"  // üstüne gelince

    // sadece bu ülkeler tıklanabilir (sample.byCountry'da olanlar)
    const selectableCountries = Object.values(mapToTR)

    // highlight için: TR -> EN
    const trToMap = {
        Türkiye: "Turkey",
        Almanya: "Germany",
        İsveç: "Sweden",
        Fransa: "France",
        Hollanda: "Netherlands",
    }

    const selectedName = selectedCountry ? (trToMap[selectedCountry] || "") : ""
    const selectedNorm = normalizeName(selectedName)

    const [position, setPosition] = useState({ coordinates: [0, 0], zoom: 1 })

    const handleMoveEnd = useCallback((pos) => {
        setPosition(pos)
    }, [])

    const onWheel = useCallback((e) => {
        e.preventDefault()
        const direction = e.deltaY > 0 ? -1 : 1
        const step = 0.2
        setPosition((p) => ({
            ...p,
            zoom: clamp(p.zoom + direction * step, 1, 8),
        }))
    }, [])

    const stroke = darkMode ? "#e9ab0d" : "#cbd5e1"
    const defaultFill = darkMode ? "#0b1220" : "#eef2ff"
    const hoverFill = darkMode ? "#1f2937" : "#dbeafe"
    const highlightFill = darkMode ? "#f59e0b" : "#f97316"

    return (
        <div
            onWheel={onWheel}
            style={{
                width: "100%",
                borderRadius: 12,
                overflow: "hidden",
                touchAction: "none",
            }}
        >
            <style>{`
                @keyframes dash {
                    to { stroke-dashoffset: -8; }
                }
            `}</style>
            <ComposableMap projection="geoNaturalEarth1" style={{ width: "100%", height: "auto" }}>
                <ZoomableGroup
                    zoom={position.zoom}
                    center={position.coordinates}
                    onMoveEnd={handleMoveEnd}
                    disablePanning={false}
                    disableDoubleClickZoom={true}
                >
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const mapName =
                                    geo.properties?.name ||
                                    geo.properties?.NAME ||
                                    geo.properties?.ADMIN ||
                                    ""

                                const isSelected = selectedNorm && normalizeName(mapName) === selectedNorm

                                const trName = mapToTR[mapName] || ""
                                const canSelect = selectableCountries.includes(trName)

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onMouseMove={(e) => {
                                            showTip?.(e, "Ülke", canSelect ? `${mapName} (tıklanabilir)` : mapName)
                                        }}
                                        onMouseLeave={() => hideTip?.()}
                                        onClick={() => {
                                            if (!canSelect) return // ✅ veri yoksa hiçbir şey yapma
                                            onSelectCountry?.(trName) // ✅ veri varsa seç
                                        }}
                                        style={{
                                            default: {
                                                fill: isSelected
                                                    ? highlightFill
                                                    : canSelect
                                                        ? baseSelectableFill
                                                        : baseOtherFill,
                                                stroke: stroke,
                                                strokeWidth: 0.6,
                                                outline: "none",
                                                cursor: canSelect ? "pointer" : "default",
                                                opacity: canSelect ? 1 : 0.35,
                                            },
                                            hover: {
                                                fill: isSelected
                                                    ? highlightFill
                                                    : canSelect
                                                        ? hoverSelectableFill
                                                        : baseOtherFill,
                                                stroke: stroke,
                                                strokeWidth: 0.8,
                                                outline: "none",
                                                cursor: canSelect ? "pointer" : "default",
                                                opacity: 1,
                                            },
                                            pressed: {
                                                fill: isSelected ? highlightFill : canSelect ? hoverSelectableFill : baseOtherFill,
                                                stroke: stroke,
                                                strokeWidth: 0.8,
                                                outline: "none",
                                                cursor: canSelect ? "pointer" : "default",
                                            },
                                        }}
                                    />
                                )
                            })
                        }
                    </Geographies>
                    {sample.shipments?.map((s) => {
                        const fromC = sample.byCountry[s.from]
                        const toC = sample.byCountry[s.to]
                        if (!fromC?.coordinates || !toC?.coordinates) return null
                        return (
                            <Line
                                key={s.id}
                                from={fromC.coordinates}
                                to={toC.coordinates}
                                stroke={darkMode ? "#fbbf24" : "#ea580c"}
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeDasharray="4 4"
                                style={{
                                    animation: "dash 1s linear infinite",
                                    filter: "drop-shadow(0 0 2px rgba(234, 88, 12, 0.5))"
                                }}
                                onMouseEnter={(e) => showTip?.(e, "🚚 Sevkiyat", `${s.value}`)}
                                onMouseLeave={() => hideTip?.()}
                            />
                        )
                    })}
                </ZoomableGroup>
            </ComposableMap>

            <div
                style={{
                    padding: "8px 10px",
                    fontSize: 12,
                    color: darkMode ? "#3b82f6" : "#4b5563",
                    fontWeight: 700,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    flexWrap: "wrap",
                    background: darkMode ? "#0f172a" : "#f3f4f6",
                    borderTop: `1px solid ${darkMode ? "#1f2937" : "#e5e7eb"}`,
                }}
            >
                <span>Seçili: {selectedCountry ? selectedCountry : "Tümü"}</span>
                <span>Wheel: zoom • Sürükle: gez</span>
            </div>
        </div>
    )
}
