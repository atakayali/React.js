import { useEffect, useRef } from "react"
import * as d3 from "d3"

export default function DonutChart({ data, darkMode, showTip, hideTip, onSelect, selectedModel }) {
    const svgRef = useRef(null)

    useEffect(() => {
        if (!data || !svgRef.current) return

        const svg = d3.select(svgRef.current)
        svg.selectAll("*").remove()

        const width = 250
        const height = 250
        const margin = 20
        const radius = Math.min(width, height) / 2 - margin

        const g = svg.append("g")
            .attr("transform", `translate(${width / 2},${height / 2})`)

        const pie = d3.pie()
            .value(d => d.value)
            .sort(null)

        const arc = d3.arc()
            .innerRadius(radius * 0.6)
            .outerRadius(radius)
            .cornerRadius(8)

        const hoverArc = d3.arc()
            .innerRadius(radius * 0.6)
            .outerRadius(radius + 5)
            .cornerRadius(8)

        const arcs = g.selectAll(".arc")
            .data(pie(data))
            .enter()
            .append("path")
            .attr("class", "arc")
            .attr("d", d => (selectedModel === d.data.name ? hoverArc(d) : arc(d)))
            .attr("fill", d => d.data.color || "#ccc")
            .attr("stroke", darkMode ? "#1f2937" : "#fff")
            .attr("stroke-width", d => (selectedModel === d.data.name ? "4px" : "2px"))
            .attr("opacity", d => (selectedModel && selectedModel !== d.data.name ? 0.6 : 1))
            .style("cursor", "pointer")
            .on("mouseover", function (event, d) {
                if (selectedModel !== d.data.name) {
                    d3.select(this).transition().duration(200).attr("d", hoverArc)
                }
                showTip(event, d.data.name, `${d.data.value} Adet`)
            })
            .on("mouseout", function (event, d) {
                if (selectedModel !== d.data.name) {
                    d3.select(this).transition().duration(200).attr("d", arc)
                }
                hideTip()
            })
            .on("click", (event, d) => {
                event.stopPropagation()
                console.log("DONUT CHART CLICKED:", d.data)
                if (onSelect) {
                    onSelect(d.data)
                } else {
                    console.warn("onSelect prop is missing in DonutChart")
                }
            })

        const total = d3.sum(data, d => d.value)

        g.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "-0.2em")
            .style("fill", darkMode ? "#fff" : "#333")
            .style("font-size", "24px")
            .style("font-weight", "bold")
            .text(total.toLocaleString())

        g.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "1.2em")
            .style("fill", darkMode ? "#94a3b8" : "#64748b")
            .style("font-size", "12px")
            .text("Depodaki Stok")

    }, [data, darkMode, onSelect, selectedModel])

    return (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg ref={svgRef} viewBox="0 0 250 250" style={{ maxWidth: "100%", maxHeight: "100%" }} />
        </div>
    )
}
