/**
 * Convert SASS files to Emotion CSS-in-JS TypeScript files
 *
 * Usage: ts-node script/sass-to-emotion.ts <input.sass> [output.ts]
 */

import * as fs from 'fs'
import * as path from 'path'

interface ConversionResult {
    success: boolean
    message: string
    file?: string
}

/**
 * Convert SASS indentation to proper CSS nesting
 */
function convertSassIndentationToCSS(lines: string[]): string {
    const result: string[] = []
    const openBlocks: Array<{ depth: number, type: 'selector' | 'property' }> = []
    let lastWasClass = false

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const indent = line.match(/^\s*/)?.[0].length || 0
        const trimmed = line.trim()

        if (!trimmed) {
            continue
        }

        const currentLevel = Math.floor(indent / 4)

        // Close blocks whose depth is greater than current
        if (openBlocks.length > 0 && openBlocks[openBlocks.length - 1].depth >= currentLevel && trimmed.startsWith('.')) {
            const block = openBlocks.pop()!
            result.push('    '.repeat(block.depth + 1) + '}')
            result.push('')
            lastWasClass = false
        } else {
            // Close blocks but without adding space
            while (openBlocks.length > 0 && openBlocks[openBlocks.length - 1].depth >= currentLevel) {
                const block = openBlocks.pop()!
                result.push('    '.repeat(block.depth + 1) + '}')
            }
        }

        // Handle nested selectors (class, element, etc.)
        if (trimmed.startsWith('.')) {
            // Add blank line before first nested selector if there were properties before
            if (result.length > 0 && !lastWasClass) {
                const lastLine = result[result.length - 1].trim()
                if (lastLine.endsWith(';') || lastLine.includes(':')) {
                    result.push('')
                }
            }
            // Handle compound selectors like .el-switch__core .el-switch__action
            const fullSelector = trimmed.replace(/\s+/g, ' ')
            result.push('    '.repeat(currentLevel + 1) + `& ${fullSelector} {`)
            openBlocks.push({ depth: currentLevel, type: 'selector' })
            lastWasClass = true
        } else if (trimmed.includes(':')) {
            // Regular CSS property
            const property = trimmed.endsWith(';') ? trimmed : trimmed + ';'
            result.push('    '.repeat(currentLevel + 1) + property)
            lastWasClass = false
        }
    }

    // Close all remaining open blocks
    while (openBlocks.length > 0) {
        const block = openBlocks.pop()!
        result.push('    '.repeat(block.depth + 1) + '}')
    }

    return result.join('\n')
}

/**
 * Convert SASS content to Emotion CSS
 */
function convertSassToEmotion(sassContent: string): string {
    // Parse SASS to find root selectors
    const lines = sassContent.split('\n')
    const rootSelectors: Array<{ selector: string; content: string }> = []
    let currentSelector = ''
    let currentContent: string[] = []
    let currentIndent = 0

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const indent = line.match(/^\s*/)?.[0].length || 0
        const trimmed = line.trim()

        if (!trimmed) {
            currentContent.push('')
            continue
        }

        // Check if it's a root-level selector (indent = 0)
        if (indent === 0 && (trimmed.startsWith('.') || trimmed.startsWith('#') || trimmed.includes('[') || trimmed.startsWith('html'))) {
            // Save previous selector
            if (currentSelector) {
                rootSelectors.push({
                    selector: currentSelector,
                    content: currentContent.join('\n'),
                })
            }

            // Start new selector
            currentSelector = trimmed
            currentContent = []
            currentIndent = indent
        } else {
            currentContent.push(line)
        }
    }

    // Save last selector
    if (currentSelector) {
        rootSelectors.push({
            selector: currentSelector,
            content: currentContent.join('\n'),
        })
    }

    // Convert each selector
    const convertedSelectors: string[] = []

    rootSelectors.forEach(({ selector, content }) => {
        // Fix invalid selectors like "html[data-theme='dark']:root"
        // Split compound selectors
        let finalSelector = selector
        if (selector.includes(':root') && selector.includes('[')) {
            // Change html[...]:root to just the attribute selector
            finalSelector = selector.replace(':root', '')
        }

        // Convert selector to camelCase for variable name
        const cleanedSelector = finalSelector.replace(/:\w+/g, '')
        const varName = cleanedSelector
            .replace(/[.\-#\[\]='"]/g, '_')
            .replace(/^_+/, '')
            .split('_')
            .filter(Boolean)
            .map((word, index) =>
                index === 0 ? word.charAt(0).toLowerCase() + word.slice(1) : word.charAt(0).toUpperCase() + word.slice(1)
            )
            .join('')

        // Convert the content (SASS nesting to CSS)
        const cssContent = convertSassIndentationToCSS(content.split('\n'))

            // Build the css() call
            // If the selector starts with a class, create a scoped class
            if (finalSelector.startsWith('.')) {
                // For class selectors, output just the content (the class name becomes the emotion class)
                convertedSelectors.push(`export const ${varName} = css\`
${cssContent}
\``)
            } else {
                // For other selectors (html, body, etc.), include the selector
                convertedSelectors.push(`export const ${varName} = css\`
    ${finalSelector} {
${cssContent}
    }
\``)
            }
    })

    return `/**
 * Auto-generated from SASS file
 */

import { css } from '@emotion/css'

${convertedSelectors.join('\n\n')}
`
}

/**
 * Generate TypeScript file with Emotion CSS
 */
function convertSassToEmotionFile(
    inputPath: string,
    outputPath?: string
): ConversionResult {
    try {
        if (!fs.existsSync(inputPath)) {
            return {
                success: false,
                message: `File not found: ${inputPath}`,
            }
        }

        const sassContent = fs.readFileSync(inputPath, 'utf-8')
        const emotionContent = convertSassToEmotion(sassContent)

        // Determine output path
        const defaultOutput = inputPath
            .replace(/\.sass$/, '.ts')
            .replace(/\.scss$/, '.ts')

        const finalOutputPath = outputPath || defaultOutput

        // Ensure output directory exists
        const outputDir = path.dirname(finalOutputPath)
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true })
        }

        // Write output file
        fs.writeFileSync(finalOutputPath, emotionContent, 'utf-8')

        return {
            success: true,
            message: `✓ Successfully converted ${inputPath} to ${finalOutputPath}`,
            file: finalOutputPath,
        }
    } catch (error) {
        return {
            success: false,
            message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }
    }
}

/**
 * Batch convert multiple SASS files
 */
function batchConvertSassFiles(inputPaths: string[]): ConversionResult[] {
    return inputPaths.map(path => convertSassToEmotionFile(path))
}

/**
 * Find all SASS files in a directory
 */
function findAllSassFiles(dir: string): string[] {
    const files: string[] = []

    function walk(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true })

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name)

            if (entry.isDirectory()) {
                walk(fullPath)
            } else if (entry.isFile() && /\.s[ac]ss$/.test(entry.name)) {
                files.push(fullPath)
            }
        }
    }

    walk(dir)
    return files
}

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2)

    if (args.length === 0) {
        console.log(`
Usage:
  ts-node script/sass-to-emotion.ts <input.sass> [output.ts]
  ts-node script/sass-to-emotion.ts --dir <directory>

Examples:
  ts-node script/sass-to-emotion.ts src/styles/button.sass
  ts-node script/sass-to-emotion.ts src/styles/button.sass src/styles/button.ts
  ts-node script/sass-to-emotion.ts --dir src/pages/app/components
`)
        process.exit(1)
    }

    if (args[0] === '--dir') {
        // Batch convert all SASS files in a directory
        const dir = args[1]
        if (!dir) {
            console.error('Error: Directory path required')
            process.exit(1)
        }

        const sassFiles = findAllSassFiles(dir)
        console.log(`Found ${sassFiles.length} SASS files`)

        const results = batchConvertSassFiles(sassFiles)
        const successCount = results.filter(r => r.success).length

        results.forEach(r => console.log(r.message))
        console.log(`\n✓ Converted ${successCount}/${results.length} files`)

        process.exit(successCount === results.length ? 0 : 1)
    } else {
        // Single file conversion
        const [inputFile, outputFile] = args
        const result = convertSassToEmotionFile(inputFile, outputFile)

        console.log(result.message)
        process.exit(result.success ? 0 : 1)
    }
}

