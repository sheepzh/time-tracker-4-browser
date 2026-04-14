import { Compilation, type Compiler, type RspackPluginInstance, sources } from '@rspack/core'

export class GenerateJsonPlugin implements RspackPluginInstance {
    private static readonly NAME = 'GenerateJsonPlugin'

    constructor(private outputPath: string, private data: unknown) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data option')
        }
        if (!outputPath.endsWith('.json')) {
            throw new Error('outputPath must be .json file')
        }
    }

    apply(compiler: Compiler) {
        compiler.hooks.thisCompilation.tap(GenerateJsonPlugin.NAME, compilation => {
            compilation.hooks.processAssets.tap({
                name: GenerateJsonPlugin.NAME,
                stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
            }, () => {
                try {
                    const json = JSON.stringify(this.data)
                    const raw = new sources.RawSource(json)
                    compilation.emitAsset(this.outputPath, raw)
                } catch (e) {
                    compilation.errors.push(new Error(`[SimpleWriteJson] ${(e as Error)?.message}`))
                }
            })
        })
    }
}