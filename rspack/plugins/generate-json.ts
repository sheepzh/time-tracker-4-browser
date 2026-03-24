import { Compilation, Compiler, sources } from '@rspack/core'

type GenerateJsonPluginOptions = {
    data: unknown
    outputPath: string
}

export class GenerateJsonPlugin {
    private options: GenerateJsonPluginOptions

    constructor(outputPath: string, data: unknown) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data option')
        }
        if (!outputPath?.endsWith('.json')) {
            throw new Error('outputPath must be .json file')
        }

        this.options = { outputPath, data }
    }

    apply(compiler: Compiler) {
        compiler.hooks.thisCompilation.tap('GenerateJsonPlugin', (compilation) => {
            compilation.hooks.processAssets.tap({
                name: 'GenerateJsonPlugin',
                stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
            }, () => {
                try {
                    const json = JSON.stringify(this.options.data)

                    compilation.emitAsset(this.options.outputPath, {
                        source: () => json,
                        size: () => json.length
                    } as sources.Source)

                } catch (e) {
                    compilation.errors.push(new Error(`[SimpleWriteJson] ${(e as Error)?.message}`))
                }
            })
        })
    }
}