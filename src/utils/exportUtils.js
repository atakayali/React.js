export function exportToCSV(data, filename = "dashboard-report.csv") {
    if (!data || !data.length) {
        console.warn("No data to export")
        return
    }

    // 1. Get headers
    const headers = Object.keys(data[0])

    // 2. Format CSV content with semicolon delimiter for Excel compatibility
    const csvContent = [
        headers.join(";"), // Header row with semicolon
        ...data.map(row =>
            headers.map(header => {
                const value = row[header]
                // Handle null/undefined
                if (value === null || value === undefined) return ""
                // Escape quotes and wrap in quotes if contains semicolon or special chars
                const strValue = String(value).replace(/"/g, '""')
                return `"${strValue}"`
            }).join(";")
        )
    ].join("\r\n") // Windows line endings for better Excel compatibility

    // 3. Add UTF-8 BOM for Excel to recognize Turkish characters
    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up the URL object
    URL.revokeObjectURL(url)
}
