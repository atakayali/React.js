import { hashStr } from "./helpers"

export function makeDailyOrders30(seedKey) {
    const seed = hashStr(seedKey)

    return Array.from({ length: 30 }, (_, i) => {
        const r1 = (Math.sin(seed + (i + 1) * 13.37) + 1) / 2
        const r2 = (Math.cos(seed * 0.7 + (i + 1) * 7.77) + 1) / 2

        const min = 2
        const max = 5
        const value = Math.round(min + (r1 * 0.6 + r2 * 0.4) * (max - min))

        return {
            day: String(i + 1).padStart(2, "0"),
            value,
        }
    })
}

export function makeDailyOrders180(seedKey) {
    const seed = hashStr(seedKey)

    return Array.from({ length: 180 }, (_, i) => {
        const r1 = (Math.sin(seed + (i + 1) * 0.5) + 1) / 2
        const r2 = (Math.cos(seed * 0.3 + (i + 1) * 0.2) + 1) / 2

        // Orders
        const minO = 1
        const maxO = 8
        const orders = Math.round(minO + (r1 * 0.7 + r2 * 0.3) * (maxO - minO))

        // Production (usually slightly higher, different pattern)
        const p1 = (Math.sin(seed * 2 + (i + 1) * 0.4) + 1) / 2
        const production = Math.round(orders * 1.2 + (p1 * 3))

        return {
            day: String(i + 1),
            orders,
            production
        }
    })
}

// Demo amaçlı: ülke+aya göre deterministik (aynı seçim = aynı fiyatlar)
export function getUnitEconomics(countryKey = "ALL", month = "ALL") {
    const seed = hashStr(`${countryKey}|${month}`)

    // satış fiyatı: 180..260
    const unitSalePrice = 180 + (seed % 81)

    // maliyet: satışın %55..%78'i
    const unitCost = Math.round(unitSalePrice * (0.55 + ((seed % 24) / 100)))

    return { unitSalePrice, unitCost }
}
