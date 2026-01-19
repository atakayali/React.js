import { useState, useCallback } from "react"
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker, Line } from "react-simple-maps"
import { sample } from "../data/sampleData"
import { clamp } from "../utils/helpers"

export default function TurkeyMap({
    darkMode,
    showTip,
    hideTip,
    onBack // Function to go back to World Map
}) {
    const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

    // Turkey's approx center and good zoom level to fill the card
    // Center: [35, 39], Zoom: ~4 or 5 depending on container size
    const [position, setPosition] = useState({ coordinates: [35, 39], zoom: 4.5 })

    const cities = sample.byCountry.Türkiye?.cities || []

    const handleMoveEnd = useCallback((pos) => {
        setPosition(pos)
    }, [])

    const onWheel = useCallback((e) => {
        e.preventDefault()
        // Optional: disable zoom on scroll if we want fixed view, but zooming is nice
        const direction = e.deltaY > 0 ? -1 : 1
        const step = 0.2
        setPosition((p) => ({
            ...p,
            zoom: clamp(p.zoom + direction * step, 2, 10),
        }))
    }, [])

    const stroke = darkMode ? "#e9ab0d" : "#cbd5e1"
    const defaultFill = darkMode ? "#1e293b" : "#e0e7ff"
    const highlightFill = darkMode ? "#f59e0b" : "#f97316"
    const markerColor = darkMode ? "#ef4444" : "#dc2626"
    const markerStroke = darkMode ? "#fff" : "#fff"

    return (
        <div
            onWheel={onWheel}
            style={{
                width: "100%",
                height: "100%",
                borderRadius: 12,
                overflow: "hidden",
                position: "relative",
                background: darkMode ? "#0f172a" : "#eff6ff" // Ocean color-ish
            }}
        >
            <style>{`
                @keyframes dash {
                    to { stroke-dashoffset: -8; }
                }
            `}</style>
            <div
                style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    zIndex: 10,
                    background: darkMode ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.8)",
                    padding: "4px 8px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: "bold",
                    cursor: "pointer",
                    border: `1px solid ${darkMode ? "#4b5563" : "#cbd5e1"}`
                }}
                onClick={onBack}
            >
                ← Geri Dön (Dünya)
            </div>

            <ComposableMap projection="geoMercator" style={{ width: "100%", height: "100%" }}>
                <ZoomableGroup
                    zoom={position.zoom}
                    center={position.coordinates}
                    onMoveEnd={handleMoveEnd}
                >
                    {/* Render regular world map but we only care about Turkey context */}
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const isTurkey = geo.properties.name === "Turkey"
                                // Dim other countries, highlight Turkey slightly
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        style={{
                                            default: {
                                                fill: isTurkey ? defaultFill : (darkMode ? "#020617" : "#f8fafc"),
                                                stroke: isTurkey ? stroke : (darkMode ? "#1e293b" : "#e2e8f0"),
                                                strokeWidth: isTurkey ? 1 : 0.5,
                                                outline: "none",
                                            },
                                            hover: {
                                                fill: isTurkey ? defaultFill : (darkMode ? "#020617" : "#f8fafc"), // No hover effect for land
                                                stroke: isTurkey ? stroke : (darkMode ? "#1e293b" : "#e2e8f0"),
                                                outline: "none"
                                            },
                                            pressed: { outline: "none" }
                                        }}
                                    />
                                )
                            })
                        }
                    </Geographies>

                    {/* Domestic Logistics */}
                    {cities.length >= 3 && (
                        <g>
                            <Line
                                from={cities[0].coordinates}
                                to={cities[1].coordinates}
                                stroke={darkMode ? "#fbbf24" : "#ea580c"}
                                strokeWidth={2}
                                strokeDasharray="4 4"
                                style={{ animation: "dash 1s linear infinite", opacity: 0.8 }}
                            />
                            <Line
                                from={cities[2].coordinates}
                                to={cities[0].coordinates}
                                stroke={darkMode ? "#fbbf24" : "#ea580c"}
                                strokeWidth={2}
                                strokeDasharray="4 4"
                                style={{ animation: "dash 1.2s linear infinite reverse", opacity: 0.8 }}
                            />
                        </g>
                    )}

                    {/* City Markers */}
                    {cities.map((city) => (
                        <Marker key={city.name} coordinates={city.coordinates}>
                            <circle
                                r={5}
                                fill={markerColor}
                                stroke={markerStroke}
                                strokeWidth={2}
                                style={{ cursor: "pointer" }}
                                onMouseMove={(e) => showTip?.(e, city.name, `Satış Payı: ${city.value}`)}
                                onMouseLeave={hideTip}
                            />
                            <text
                                textAnchor="middle"
                                y={-10}
                                style={{
                                    fontFamily: "system-ui",
                                    fill: darkMode ? "#fff" : "#111827",
                                    fontSize: 10,
                                    fontWeight: "bold",
                                    pointerEvents: "none"
                                }}
                            >
                                {city.name}
                            </text>
                        </Marker>
                    ))}
                </ZoomableGroup>
            </ComposableMap>
        </div>
    )
}
