import { useMemo, useState, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import * as d3 from "d3"

// Data & Utils
import { sample } from "./data/sampleData"
import { ease } from "./utils/constants"
import { makeDailyOrders30, makeDailyOrders180, getUnitEconomics } from "./utils/economics"
import { exportToCSV } from "./utils/exportUtils"

// Components
import Sidebar from "./components/Sidebar"
import Chip from "./components/Chip"
import Card from "./components/Card"
import KPI from "./components/KPI"
import WorldMapHighlight from "./components/WorldMapHighlight"
import TurkeyMap from "./components/TurkeyMap"

// Charts
import BarChart from "./components/charts/BarChart"
import ScrollableLineChart from "./components/charts/ScrollableLineChart"
import ScatterChart from "./components/charts/ScatterChart"
import WaterfallChart from "./components/charts/WaterfallChart"
import ProfitRoseChart from "./components/charts/ProfitRoseChart"
import FunnelChart from "./components/charts/FunnelChart"
import DonutChart from "./components/charts/DonutChart" // ✅ Import
import AreaChart from "./components/charts/AreaChart" // ✅ Import
import CarStorageChart from "./components/charts/CarStorageChart" // ✅ Import
import ComboChart from "./components/charts/ComboChart" // ✅ Import

export default function App() {
  const GRID_ROW = 36

  // Global State
  const [activeTab, setActiveTab] = useState("dashboard")
  const [darkMode, setDarkMode] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Calculate total sales for capacity
  const totalCarSales = useMemo(() => {
    return sample.salesByModel.reduce((acc, curr) => acc + curr.value, 0)
  }, [])

  // Dashboard State
  const [tip, setTip] = useState({ show: false, x: 0, y: 0, title: "", value: "" })
  const [barHoverIndex, setBarHoverIndex] = useState(null)
  // Stock Gauge State (Derived)
  const [selectedModel, setSelectedModel] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("")

  const handleModelChange = useCallback((modelName) => {
    // Toggle off if same model clicked
    if (selectedModel === modelName) {
      setSelectedModel("")
      return
    }
    setSelectedModel(modelName)
  }, [selectedModel])

  const onDonutSelect = useCallback((item) => {
    handleModelChange(item.name)
  }, [handleModelChange])

  // Dynamic Stock Calculation
  const { stockValue, stockCapacity } = useMemo(() => {
    // 1. Determine Base Capacity & Value
    let baseCap = 15000 // Global Default
    let baseVal = totalCarSales

    if (selectedModel) {
      const model = sample.salesByModel.find(m => m.name === selectedModel)
      if (model) {
        baseCap = model.capacity || 2500
        // Assume starting stock (Jan) is near capacity, not just sales value
        baseVal = model.capacity ? model.capacity * 0.9 : model.value
      }
    }

    // 2. Apply Country Factor (Simulation)
    let countryFactor = 1.0
    if (selectedCountry === "Türkiye") countryFactor = 0.50
    else if (selectedCountry) countryFactor = 0.125 // Other countries are smaller chunks
    // If "All", factor is 1.0

    // 3. Apply Month Factor (Depletion Simulation)
    // "Oca"=0, "Haz"=5. Decrease stock as months pass.
    let monthFactor = 1.0
    if (selectedMonth) {
      const monthIndex = ["Oca", "Şub", "Mar", "Nis", "May", "Haz"].indexOf(selectedMonth)
      if (monthIndex > -1) {
        // Model specific decay rates
        const decayRates = {
          "SUV (T10X)": 0.04,        // Slow decay (popular but high stock)
          "Sedan (C-Class)": 0.08,   // Normal
          "Hatchback": 0.06,         // Moderate
          "Ticari (Van)": 0.12,      // Fast decay (low stock)
          "Elektrikli (EV)": 0.05    // Slow
        }
        const rate = (selectedModel && decayRates[selectedModel]) || 0.08

        // Lose 'rate' per month
        monthFactor = 1.0 - (monthIndex * rate)
      }
    }

    // Calculate Final
    const capacity = Math.floor(baseCap * countryFactor)
    // Value = Capacity * MonthFactor (Depletion)
    // Ensure value doesn't exceed capacity
    const value = Math.floor(Math.min(capacity, capacity * monthFactor * 0.95)) // 95% full at start

    return { stockValue: value, stockCapacity: capacity }
  }, [selectedModel, selectedCountry, selectedMonth, totalCarSales])



  const countryKeyMap = {
    Türkiye: "Turkey",
    Almanya: "Germany",
    İsveç: "Sweden",
    Fransa: "France",
    Hollanda: "Netherlands",
  }

  const selectedCountryKey = selectedCountry
    ? (countryKeyMap[selectedCountry] || selectedCountry)
    : "ALL"

  const allCountryKeys = useMemo(() => {
    return Object.keys(sample.byCountry || {}).map((tr) => countryKeyMap[tr] || tr)
  }, [])

  const showTip = (e, title, value) =>
    setTip({ show: true, x: e.clientX, y: e.clientY - 20, title, value })
  const hideTip = () => setTip((t) => ({ ...t, show: false }))


  // --- DATA CALCULATIONS START ---
  const monthsAll = useMemo(() => sample.monthlyProduction.map((m) => m.month), [])
  const monthsToSum = useMemo(() => (selectedMonth ? [selectedMonth] : monthsAll), [selectedMonth, monthsAll])

  const getMonthlyOrderTotal = useMemo(() => {
    return (month, countryKey = selectedCountryKey) => {
      if (!month) return 0
      if (countryKey === "ALL") {
        return d3.sum(allCountryKeys, (ck) => {
          const orders30 = makeDailyOrders30(`country:${ck}|month:${month}`)
          return d3.sum(orders30, (d) => d.value)
        })
      }
      const orders30 = makeDailyOrders30(`country:${countryKey}|month:${month}`)
      return d3.sum(orders30, (d) => d.value)
    }
  }, [selectedCountryKey, allCountryKeys])

  const active = useMemo(() => {
    if (selectedCountry && sample.byCountry?.[selectedCountry]) {
      return sample.byCountry[selectedCountry]
    }
    return {
      monthlyProduction: sample.monthlyProduction,
      dailyOrders: sample.dailyOrders,
      downtimeByReason: sample.downtimeByReason,
    }
  }, [selectedCountry])

  const filteredProduction = useMemo(() => {
    const base = active.monthlyProduction
    return selectedMonth ? base.filter((d) => d.month === selectedMonth) : base
  }, [active, selectedMonth])

  // KPI Logic
  const kpis = useMemo(() => {
    const countries = Object.keys(sample.byCountry || {})
    const monthsAllLocal = sample.monthlyProduction.map((m) => m.month)
    const monthsToSumLocal = selectedMonth ? [selectedMonth] : monthsAllLocal

    const getProductionTotalForCountry = (country) => {
      const mp = sample.byCountry?.[country]?.monthlyProduction || []
      const mpFiltered = mp.filter((d) => monthsToSumLocal.includes(d.month))
      return d3.sum(mpFiltered, (d) => d.value)
    }
    const getOrdersTotalForCountry = (country) => {
      return d3.sum(monthsToSumLocal, (m) => {
        const orders30 = makeDailyOrders30(`country:${country}|month:${m}`)
        return d3.sum(orders30, (d) => d.value)
      })
    }
    let totalProduction = 0
    let totalOrders = 0
    if (selectedCountry) {
      totalProduction = getProductionTotalForCountry(selectedCountry)
      totalOrders = getOrdersTotalForCountry(selectedCountry)
    } else {
      totalProduction = d3.sum(countries, (c) => getProductionTotalForCountry(c))
      totalOrders = d3.sum(countries, (c) => getOrdersTotalForCountry(c))
    }

    const cKey = selectedCountry ? (countryKeyMap[selectedCountry] || "ALL") : "ALL"
    const totalRevenue = d3.sum(monthsToSumLocal, (m) => {
      const { unitSalePrice } = getUnitEconomics(cKey, m)
      const ordersForMonth = getMonthlyOrderTotal(m, selectedCountry ? cKey : "ALL")
      return ordersForMonth * unitSalePrice
    })
    const totalCost = d3.sum(monthsToSumLocal, (m) => {
      const { unitCost } = getUnitEconomics(cKey, m)
      const prod = selectedCountry
        ? d3.sum((sample.byCountry?.[selectedCountry]?.monthlyProduction || []).filter(x => x.month === m), (d) => d.value)
        : d3.sum(Object.keys(sample.byCountry || {}), (c) => {
          const mp = sample.byCountry?.[c]?.monthlyProduction || []
          return d3.sum(mp.filter(x => x.month === m), (d) => d.value)
        })
      return prod * unitCost
    })
    const totalGrossProfit = totalRevenue - totalCost

    return {
      totalProduction, totalOrders, totalRevenue, totalCost, totalGrossProfit,
      targetProduction: Math.round(totalProduction * 1.15), trendProduction: 12,
      targetOrders: Math.round(totalOrders * 1.1), trendOrders: 8,
      targetRevenue: Math.round(totalRevenue * 1.2), trendRevenue: 15,
      targetCost: Math.round(totalCost * 1.05), trendCost: -4,
      targetProfit: (Math.round(totalRevenue * 1.2) - Math.round(totalCost * 1.05)), trendProfit: 22
    }
  }, [selectedCountry, selectedMonth])

  // Chart Data
  const topSalesOrCities = useMemo(() => {
    if (selectedCountry === "Türkiye") {
      const cities = sample.byCountry.Türkiye?.cities || []
      return cities.map(c => ({ name: c.name, value: c.value * 1000 })).sort((a, b) => b.value - a.value)
    }
    const monthsToUse = selectedMonth ? [selectedMonth] : monthsAll
    const { unitSalePrice } = getUnitEconomics()
    const rows = Object.keys(sample.byCountry || {}).map((countryTR) => {
      const cKey = countryKeyMap[countryTR] || countryTR
      const totalOrders = d3.sum(monthsToUse, (m) => getMonthlyOrderTotal(m, cKey))
      return { name: countryTR, value: totalOrders * unitSalePrice }
    })
    return rows.sort((a, b) => b.value - a.value).slice(0, 6)
  }, [selectedCountry, selectedMonth, getMonthlyOrderTotal])

  const scrollOrders30 = useMemo(() => {
    const monthKey = selectedMonth || "ALL_MONTHS"
    const cKey = selectedCountryKey || "ALL"
    return makeDailyOrders30(`country:${cKey}|month:${monthKey}`)
  }, [selectedCountryKey, selectedMonth])

  // NEW: 180 Days Data (Ignores Month Filter)
  const scrollOrders180 = useMemo(() => {
    const cKey = selectedCountryKey || "ALL"
    // "YEAR_VIEW" ensures it's a fixed view for the country, unrelated to selected month
    return makeDailyOrders180(`country:${cKey}|view:YEARly`)
  }, [selectedCountryKey])

  const scatterSeries = useMemo(() => {
    const prodSeries = selectedMonth ? filteredProduction : active.monthlyProduction
    return prodSeries.map((p) => {
      const orders = getMonthlyOrderTotal(p.month, selectedCountryKey)
      return { x: p.value, y: p.value - orders, month: p.month, production: p.value, orders }
    })
  }, [active, filteredProduction, selectedMonth, selectedCountryKey, getMonthlyOrderTotal])

  const profitByCountryOrCity = useMemo(() => {
    if (selectedCountry === "Türkiye") {
      const cities = sample.byCountry.Türkiye?.cities || []
      return cities.map(c => ({ name: c.name, value: c.value * 500 })).sort((a, b) => b.value - a.value)
    }
    const monthsToSumLocal = selectedMonth ? [selectedMonth] : monthsAll
    const { unitSalePrice, unitCost } = getUnitEconomics()
    const rows = Object.keys(sample.byCountry || {}).map((countryTR) => {
      const cKey = countryKeyMap[countryTR] || countryTR
      const profit = d3.sum(monthsToSumLocal, (m) => {
        const prod = d3.sum((sample.byCountry?.[countryTR]?.monthlyProduction || []).filter((x) => x.month === m), (d) => d.value)
        const orders = getMonthlyOrderTotal(m, selectedCountry ? (countryKeyMap[countryTR] || countryTR) : cKey)
        return (orders * unitSalePrice) - (prod * unitCost)
      })
      return { name: countryTR, value: Math.max(0, profit) }
    })
    return rows.sort((a, b) => b.value - a.value)
  }, [selectedMonth, selectedCountry, getMonthlyOrderTotal])

  const waterfallSeries = useMemo(() => {
    const prodSeries = selectedMonth ? filteredProduction : active.monthlyProduction
    let cum = 0
    return prodSeries.map((p) => {
      const orders = getMonthlyOrderTotal(p.month, selectedCountryKey)
      const diff = p.value - orders
      const start = cum; cum += diff; const end = cum
      return { month: p.month, production: p.value, orders, diff, start, end }
    })
  }, [active, filteredProduction, selectedMonth, selectedCountryKey])

  // Monthly Profit vs Target Data for ComboChart
  const monthlyProfitVsTarget = useMemo(() => {
    const months = sample.monthlyProduction.map(m => m.month)
    const cKey = selectedCountryKey || "ALL"

    return months.map(month => {
      const { unitSalePrice, unitCost } = getUnitEconomics(cKey, month)

      // Calculate orders and production for the month
      const orders = getMonthlyOrderTotal(month, cKey)
      const prod = selectedCountry
        ? d3.sum((sample.byCountry?.[selectedCountry]?.monthlyProduction || []).filter(x => x.month === month), d => d.value)
        : d3.sum(Object.keys(sample.byCountry || {}), c => {
          const mp = sample.byCountry?.[c]?.monthlyProduction || []
          return d3.sum(mp.filter(x => x.month === month), d => d.value)
        })

      const revenue = orders * unitSalePrice
      const cost = prod * unitCost
      const profit = revenue - cost
      const target = profit * 1.2 // Hedef = Kârın %20 fazlası

      return { month, profit: Math.max(0, profit), target: Math.max(0, target) }
    })
  }, [selectedCountry, selectedCountryKey, getMonthlyOrderTotal])

  const countries = useMemo(() => Array.from(new Set(sample.customers.map((c) => c.country))).sort(), [])
  const filteredCustomers = useMemo(() => sample.customers.filter(c => selectedCountry ? c.country === selectedCountry : true), [selectedCountry])
  // --- DATA CALCULATIONS END ---


  const handleExport = () => {
    const productionData = filteredProduction.map(p => ({ Type: "Production", Month: p.month, Value: p.value, Country: selectedCountry || "All" }))
    const summaryData = [{ Type: "KPI_Summary", Month: selectedMonth || "All", Value: `Rev:${kpis.totalRevenue}|Cost:${kpis.totalCost}`, Country: selectedCountry || "All" }]
    exportToCSV([...productionData, ...summaryData], "dashboard-data.csv")
  }


  // --- VIEW CONTENT RENDERING ---

  // Placeholder for other pages
  const PlaceholderPage = ({ title, icon }) => (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      color: darkMode ? "#94a3b8" : "#64748b"
    }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>{icon}</div>
      <h2 style={{ fontSize: 24, fontWeight: "bold" }}>{title}</h2>
      <p>Bu sayfa henüz yapım aşamasında.</p>
    </div>
  )

  return (
    <div style={{
      display: "flex",
      width: "100%", // ✅ Revert to flow layout
      minHeight: "100vh",
      background: darkMode ? "#111827" : "#f9fafb",
      fontFamily: "Arial, sans-serif",
      // boxSizing is handled by charts usually, but global reset below helps
    }}>
      <style>{`
            body { margin: 0; padding: 0; overflow-x: hidden; }
            * { box-sizing: border-box; }
        `}</style>
      {/* 1. SIDEBAR */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* BACKDROP (Overlay when open) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "#000",
              zIndex: 90,
              cursor: "pointer"
            }}
          />
        )}
      </AnimatePresence>

      {/* PROFILE TRIGGER BUTTON */}
      {!isSidebarOpen && (
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsSidebarOpen(true)}
          style={{
            position: "fixed",
            left: 20,
            top: 20,
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 18,
            fontWeight: "bold",
            cursor: "pointer",
            zIndex: 80
          }}
        >
          A
        </motion.div>
      )}

      {/* 2. MAIN CONTENT AREA */}
      <div style={{
        flex: 1,
        // height: "100%", // Let it grow naturally
        // overflowY: "auto", // Let window scroll
        padding: 24,
        position: "relative",
        background: darkMode ? "#050b16" : "#f9fafb",
        color: darkMode ? "#f9fafb" : "#111827",
        transition: "background 0.35s ease, color 0.35s ease"
      }}>

        {/* VIEW: DASHBOARD */}
        {activeTab === "dashboard" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {/* Header */}
            <div style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", gap: 12, paddingLeft: 60 /* Space for Profile Button */ }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>Dashboard</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                  <Chip text={`Ülke: ${selectedCountry ? selectedCountry : "Tümü"}`} darkMode={darkMode} />
                  {selectedMonth && <Chip text={`Ay: ${selectedMonth}`} darkMode={darkMode} />}
                  {selectedCountry === "Türkiye" && <Chip text="Şehir Detayı Aktif" darkMode={darkMode} color="#16a34a" />}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
                  onClick={handleExport}
                  style={{
                    padding: "10px 16px", borderRadius: 10, border: `1px solid ${darkMode ? "#1f2937" : "#e5e7eb"}`,
                    cursor: "pointer", background: darkMode ? "#1e293b" : "#ffffff", color: darkMode ? "#f9fafb" : "#111827",
                    fontWeight: 800, height: 42, display: "flex", alignItems: "center", gap: 8
                  }}
                >
                  📊 Export CSV
                </motion.button>
              </div>
            </div>

            {/* KPI Grid */}
            <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap", alignItems: "stretch" }}>
              <KPI label="Toplam Üretim" value={kpis.totalProduction} target={kpis.targetProduction} trend={kpis.trendProduction} darkMode={darkMode} />
              <KPI label="Toplam Sipariş" value={kpis.totalOrders} target={kpis.targetOrders} trend={kpis.trendOrders} darkMode={darkMode} />
              <KPI label="Toplam Ciro (₺)" value={kpis.totalRevenue} target={kpis.targetRevenue} trend={kpis.trendRevenue} formatValue={(v) => Math.round(v).toLocaleString("tr-TR")} darkMode={darkMode} />
              <KPI label="Toplam Maliyet (₺)" value={kpis.totalCost} target={kpis.targetCost} trend={kpis.trendCost} formatValue={(v) => Math.round(v).toLocaleString("tr-TR")} darkMode={darkMode} />
              <KPI label="Toplam Brüt Kâr (₺)" value={kpis.totalGrossProfit} target={kpis.targetProfit} trend={kpis.trendProfit} formatValue={(v) => Math.round(v).toLocaleString("tr-TR")} darkMode={darkMode} />
            </div>

            {/* Filter Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{
                display: "flex", alignItems: "center", gap: 12, marginBottom: 18, padding: 12, borderRadius: 14,
                border: `1px solid ${darkMode ? "#1f2937" : "#e5e7eb"}`, background: darkMode ? "#0b1220" : "#fff",
                boxShadow: darkMode ? "0 8px 18px rgba(0,0,0,0.35)" : "0 8px 18px rgba(0,0,0,0.10)",
              }}
            >
              <div style={{ fontWeight: 800 }}>Filtreler</div>
              <select
                value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  marginLeft: "auto", padding: "10px", borderRadius: 10, border: `1px solid ${darkMode ? "#1f2937" : "#e5e7eb"}`,
                  background: darkMode ? "#050b16" : "#fff", color: darkMode ? "#f9fafb" : "#111827", outline: "none"
                }}
              >
                <option value="">Tüm Aylar</option>
                {sample.monthlyProduction.map((m) => <option key={m.month} value={m.month}>{m.month}</option>)}
              </select>

              <select
                value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}
                style={{
                  padding: "10px", borderRadius: 10, border: `1px solid ${darkMode ? "#1f2937" : "#e5e7eb"}`,
                  background: darkMode ? "#050b16" : "#fff", color: darkMode ? "#f9fafb" : "#111827", outline: "none"
                }}
              >
                <option value="">Tüm Ülkeler</option>
                {countries.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setSelectedMonth(""); setSelectedCountry("") }}
                style={{
                  padding: "10px 12px", borderRadius: 10, border: `1px solid ${darkMode ? "#1f2937" : "#e5e7eb"}`,
                  background: darkMode ? "#111827" : "#f3f4f6", color: darkMode ? "#f9fafb" : "#111827",
                  cursor: "pointer", fontWeight: 800
                }}
              >
                Sıfırla
              </motion.button>
            </motion.div>

            {/* NEW: Daily Area Chart (Full Width) */}
            <div style={{ width: "100%", height: 320, marginBottom: 24 }}>
              <Card title="180 Günlük Sipariş Trendi (Yıllık/Dönemsel)" darkMode={darkMode}>
                <AreaChart data={scrollOrders180} showTip={showTip} hideTip={hideTip} darkMode={darkMode} />
              </Card>
            </div>

            {/* Charts Grid */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gridAutoRows: `${GRID_ROW}px`, columnGap: 8, rowGap: 5
            }}>
              {/* Row 1 */}
              <div style={{ gridRow: "span 8", paddingBottom: 2 }}>
                <Card title="Aylık Üretim (Bar)" darkMode={darkMode}>
                  <BarChart data={filteredProduction} xKey="month" yKey="value" showTip={showTip} hideTip={hideTip} darkMode={darkMode} hoverIndex={barHoverIndex} setHoverIndex={setBarHoverIndex} />
                </Card>
              </div>
              <div style={{ gridRow: "span 9", paddingBottom: 1 }}>
                <Card title="30 Günlük Sipariş (Scroll)" darkMode={darkMode}>
                  <ScrollableLineChart data={scrollOrders30} showTip={showTip} hideTip={hideTip} darkMode={darkMode} />
                </Card>
              </div>
              <div style={{ gridRow: "span 8", paddingBottom: 10 }}>
                <Card title="Üretim & Sipariş Farkı (Scatter Chart)" darkMode={darkMode}>
                  <ScatterChart data={scatterSeries} showTip={showTip} hideTip={hideTip} darkMode={darkMode} />
                </Card>
              </div>
              {/* Column: Waterfall + Combo Chart stacked */}
              <div style={{ gridRow: "span 18", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <Card title="Kümülatif Fark" darkMode={darkMode}>
                    <WaterfallChart data={waterfallSeries} showTip={showTip} hideTip={hideTip} darkMode={darkMode} />
                  </Card>
                </div>
                <div style={{ flex: 1 }}>
                  <Card title="Brüt Kâr vs Hedef" darkMode={darkMode}>
                    <ComboChart data={monthlyProfitVsTarget} barKey="profit" lineKey="target" xKey="month" showTip={showTip} hideTip={hideTip} darkMode={darkMode} />
                  </Card>
                </div>
              </div>

              {/* Col 2: Map + Combined Charts */}
              <div style={{ gridRow: "span 13", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ flex: 2 }}>
                  <Card title={selectedCountry === "Türkiye" ? "Türkiye Haritası" : "Dünya Haritası"} darkMode={darkMode}>
                    {selectedCountry === "Türkiye" ?
                      <TurkeyMap darkMode={darkMode} showTip={showTip} hideTip={hideTip} onBack={() => setSelectedCountry("")} /> :
                      <WorldMapHighlight selectedCountry={selectedCountry} darkMode={darkMode} showTip={showTip} hideTip={hideTip} onSelectCountry={(c) => setSelectedCountry(c)} />
                    }
                  </Card>
                </div>
                <div style={{ flex: 1 }}>
                  <Card title="Araç & Stok Durumu" darkMode={darkMode}>
                    <div style={{ padding: "0 0 10px 0", display: "flex", justifyContent: "flex-end" }}>
                      <select
                        value={selectedModel}
                        onChange={(e) => handleModelChange(e.target.value)}
                        style={{
                          padding: "6px", borderRadius: 6, border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                          background: darkMode ? "#1e293b" : "#fff", color: darkMode ? "#f9fafb" : "#111827", fontSize: 12
                        }}
                      >
                        <option value="">Model Seçiniz...</option>
                        {sample.salesByModel.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                      </select>
                    </div>
                    <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center" }}>
                      <div style={{ flex: 1, height: "100%", borderRight: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}` }}>
                        <CarStorageChart current={stockValue} capacity={stockCapacity} selectedModel={selectedModel} darkMode={darkMode} showTip={showTip} hideTip={hideTip} />
                      </div>
                      <div style={{ flex: 1, height: "100%" }}>
                        <DonutChart
                          data={sample.salesByModel}
                          darkMode={darkMode}
                          showTip={showTip}
                          hideTip={hideTip}
                          selectedModel={selectedModel}
                          onSelect={onDonutSelect}
                        />
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Col 3: Rose + Funnel */}
              <div style={{ gridRow: "span 13", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <Card title="Kâr Payı (Rose)" darkMode={darkMode}>
                    <ProfitRoseChart data={profitByCountryOrCity} darkMode={darkMode} showTip={showTip} hideTip={hideTip} />
                  </Card>
                </div>
                <div style={{ flex: 1 }}>
                  <Card title="En İyi Satışlar (Funnel)" darkMode={darkMode}>
                    <FunnelChart data={topSalesOrCities} darkMode={darkMode} showTip={showTip} hideTip={hideTip} title="" />
                  </Card>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* OTHER VIEWS */}
        {activeTab === "analytics" && <PlaceholderPage title="Analizler" icon="📈" />}
        {activeTab === "reports" && <PlaceholderPage title="Raporlar" icon="📄" />}
        {activeTab === "settings" && <PlaceholderPage title="Ayarlar" icon="⚙️" />}


        {/* Global Tooltip Portal */}
        <AnimatePresence>
          {tip.show && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98, x: "-50%", y: "-96%" }}
              animate={{ opacity: 1, scale: 1, x: "-50%", y: "-100%" }}
              exit={{ opacity: 0, scale: 0.98, x: "-50%", y: "-96%" }}
              transition={{ duration: 0.16, ease }}
              style={{
                position: "fixed", left: tip.x, top: tip.y, pointerEvents: "none",
                background: darkMode ? "rgba(11, 18, 32, 0.95)" : "rgba(255, 255, 255, 0.95)",
                color: darkMode ? "#f9fafb" : "#111827", border: `1px solid ${darkMode ? "#1f2937" : "#e5e7eb"}`,
                padding: "8px 12px", borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
                backdropFilter: "blur(8px)", zIndex: 9999, minWidth: 120, textAlign: "center"
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 4, opacity: 0.9 }}>{tip.title}</div>
              <div style={{ fontSize: 13 }}>{tip.value}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}
