import { } from 'fake-indexeddb'
import 'fake-indexeddb/auto'

/**
 * Clean up all IndexedDB databases
 */
export async function cleanupIDB() {
    return new Promise((resolve) => {
        try {
            global.indexedDB = new IDBFactory()
            setTimeout(resolve, 0)
        } catch (error) {
            console.error('Failed to cleanup database:', error)
            resolve(undefined)
        }
    })
}