export function exportToCSV(data, filename = "dashboard-report.csv") {
    if (!data || !data.length) {
        console.warn("No data to export")
        return
    }

    // 1. Get headers
    const headers = Object.keys(data[0])

    // 2. Format CSV content
    const csvContent = [
        headers.join(","), // Header row
        ...data.map(row =>
            headers.map(header => {
                const value = row[header]
                // Escape quotes and wrap in quotes if contains comma
                const strValue = String(value).replace(/"/g, '""')
                return `"${strValue}"`
            }).join(",")
        )
    ].join("\n")

    // 3. Create blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
