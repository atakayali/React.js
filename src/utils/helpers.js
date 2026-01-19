export function hashStr(str) {
    let h = 2166136261
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i)
        h = Math.imul(h, 16777619)
    }
    return Math.abs(h)
}

export function normalizeName(s = "") {
    return s
        .toString()
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // aksanları sil
}

export function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v))
}
