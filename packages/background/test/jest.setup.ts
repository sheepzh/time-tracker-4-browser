if (typeof global.structuredClone === 'undefined') {
    // Used for fake-indexeddb
    global.structuredClone = (v) => JSON.parse(JSON.stringify(v))
}