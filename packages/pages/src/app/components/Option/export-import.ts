/**
 * Copyright (c) 2025 Aka Sai Lalith Kumar
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { getOption, setOption } from "@api/sw/option"
import { deserialize, exportJson } from "@util/file"
import { mergeObject } from '@util/lang'

export interface ExportedSettings {
    version: string
    timestamp: number
    settings: timer.option.AllOption
}

/**
 * Export all settings to JSON file
 */
export async function exportSettings(): Promise<void> {
    const settings = await getOption()
    if (!settings) throw new Error('Failed to get settings')
    const exportData: ExportedSettings = {
        version: '1.0',
        timestamp: Date.now(),
        settings,
    }

    const fileName = `timer-settings-${new Date().toISOString().split('T')[0]}`
    exportJson(exportData, fileName)
}

/**
 * Import settings from JSON file
 */
export async function importSettings(jsonString: string): Promise<void> {
    const importData = deserialize(jsonString) as ExportedSettings

    if (!importData || !importData.settings) {
        throw new Error('Invalid settings file format')
    }

    // Validate the imported settings structure
    const validatedSettings = await validateAndMergeSettings(importData.settings)

    // Set the imported settings
    await setOption(validatedSettings as Partial<timer.option.AllOption>)
}

/**
 * Validate imported settings and merge with defaults to ensure all required fields exist
 */
async function validateAndMergeSettings(importedSettings: Partial<timer.option.AllOption>): Promise<timer.option.AllOption> {
    // Get current user settings as defaults instead of default options
    const defaults = await getOption()
    // Delete client name
    delete importedSettings['clientName']
    return mergeObject(defaults ?? {}, importedSettings) as timer.option.AllOption
}

/**
 * Create a file input element to select JSON file for import
 * @returns Promise that resolves with file content string, or null if user cancels
 */
export function createFileInput(): Promise<string | null> {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.style.display = 'none'

        input.onchange = (event) => {
            const file = (event.target as HTMLInputElement).files?.[0]
            if (!file) {
                // User didn't select a file (cancelled or closed dialog)
                resolve(null)
                return
            }

            const reader = new FileReader()
            reader.onload = (e) => {
                const content = e.target?.result as string
                resolve(content)
            }
            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsText(file)
        }

        input.oncancel = () => resolve(null)

        document.body.appendChild(input)
        input.click()
        document.body.removeChild(input)
    })
}
