import { useEffect, useRef } from "react"
import * as d3 from "d3"

export default function AreaChart({ data, darkMode, showTip, hideTip }) {
    const svgRef = useRef(null)

    useEffect(() => {
        if (!data || !svgRef.current) return

        const svg = d3.select(svgRef.current)
        svg.selectAll("*").remove()

        const viewBoxWidth = 1000
        const viewBoxHeight = 250
        const margin = { top: 20, right: 30, bottom: 30, left: 50 }

        const width = viewBoxWidth - margin.left - margin.right
        const height = viewBoxHeight - margin.top - margin.bottom

        // Scales
        const x = d3.scalePoint()
            .domain(data.map(d => d.day))
            .range([0, width])
            .padding(0) // Full width

        // Safe max calculation handling potential missing data
        const maxY = d3.max(data, d => Math.max(d.orders || 0, d.production || 0)) * 1.1 || 10

        const y = d3.scaleLinear()
            .domain([0, maxY])
            .range([height, 0])

        const group = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`)

        // Grid Lines
        const makeXGrid = () => d3.axisBottom(x).tickValues(x.domain().filter((d, i) => i % 15 === 0))
        const makeYGrid = () => d3.axisLeft(y).ticks(5)

        // Add X Grid
        group.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${height})`)
            .call(makeXGrid().tickSize(-height).tickFormat(""))
            .attr("color", darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)")
            .select(".domain").remove()

        // Add Y Grid
        group.append("g")
            .attr("class", "grid")
            .call(makeYGrid().tickSize(-width).tickFormat(""))
            .attr("color", darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)")
            .select(".domain").remove()

        // Generators
        const createArea = (key) => d3.area()
            .x(d => x(d.day))
            .y0(height)
            .y1(d => y(d[key] || 0))
            .curve(d3.curveMonotoneX)

        const createLine = (key) => d3.line()
            .x(d => x(d.day))
            .y(d => y(d[key] || 0))
            .curve(d3.curveMonotoneX)

        // Colors
        const prodColor = darkMode ? "#34d399" : "#059669" // Green for Production
        const orderColor = darkMode ? "#a78bfa" : "#7c3aed" // Purple for Orders

        // Gradients
        const defs = svg.append("defs")
        const addGradient = (id, color) => {
            const g = defs.append("linearGradient").attr("id", id).attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%")
            g.append("stop").attr("offset", "0%").attr("stop-color", color).attr("stop-opacity", 0.3)
            g.append("stop").attr("offset", "100%").attr("stop-color", color).attr("stop-opacity", 0.0)
        }
        addGradient("gradProd", prodColor)
        addGradient("gradOrder", orderColor)

        // Draw Production (Back)
        group.append("path").datum(data).attr("fill", "url(#gradProd)").attr("d", createArea("production"))
        group.append("path").datum(data).attr("fill", "none").attr("stroke", prodColor).attr("stroke-width", 1.5).attr("d", createLine("production"))

        // Draw Orders (Front)
        group.append("path").datum(data).attr("fill", "url(#gradOrder)").attr("d", createArea("orders"))
        group.append("path").datum(data).attr("fill", "none").attr("stroke", orderColor).attr("stroke-width", 1.5).attr("d", createLine("orders"))

        // Interactive Overlay
        const overlay = group.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "transparent")
            .style("cursor", "crosshair")

        // Vertical Guide Line
        const guideLine = group.append("line")
            .attr("stroke", darkMode ? "#fff" : "#000")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "4 4")
            .style("opacity", 0)
            .attr("y1", 0)
            .attr("y2", height)

        // Hover Dots
        const dotProd = group.append("circle").attr("r", 4).attr("fill", prodColor).style("opacity", 0)
        const dotOrder = group.append("circle").attr("r", 4).attr("fill", orderColor).style("opacity", 0)

        overlay.on("mousemove", (event) => {
            const [mx] = d3.pointer(event)
            const domain = x.domain()
            const range = x.range()
            const bandwidth = range[1] / domain.length
            const index = Math.floor(mx / bandwidth)
            const d = data[Math.min(data.length - 1, Math.max(0, index))]

            if (d) {
                const px = x(d.day)
                guideLine.attr("x1", px).attr("x2", px).style("opacity", 0.5)

                dotProd.attr("cx", px).attr("cy", y(d.production || 0)).style("opacity", 1)
                dotOrder.attr("cx", px).attr("cy", y(d.orders || 0)).style("opacity", 1)

                showTip(event, `Gün ${d.day}`, `Üretim: ${d.production} | Sipariş: ${d.orders}`)
            }
        }).on("mouseout", () => {
            guideLine.style("opacity", 0)
            dotProd.style("opacity", 0)
            dotOrder.style("opacity", 0)
            hideTip()
        })

        // Axes
        group.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickValues(x.domain().filter((d, i) => i % 15 === 0)).tickSize(0))
            .attr("color", darkMode ? "#94a3b8" : "#64748b")
            .select(".domain").remove()

        group.append("g")
            .call(d3.axisLeft(y).ticks(5).tickSize(0))
            .attr("color", darkMode ? "#94a3b8" : "#64748b")
            .select(".domain").remove()

    }, [data, darkMode])

    return (
        <div style={{ width: "100%", height: "100%", minHeight: 250 }}>
            <svg
                ref={svgRef}
                viewBox="0 0 1000 250"
                preserveAspectRatio="none"
                style={{ width: "100%", height: "100%", overflow: "visible" }}
            />
        </div>
    )
}
