import type { Compiler, RspackPluginInstance } from '@rspack/core'
import fs from 'fs'
import JSZip from 'jszip'
import path from 'path'

type PosOpt = {
    source: string
    destination: string
}

type Operation = {
    delete?: string[]
    archive?: PosOpt[]
    copy?: PosOpt[]
}

type OperationEntry<T extends keyof Operation> = [T, Exclude<Operation[T], undefined>]

interface FileManagerOptions {
    events: {
        onEnd?: Operation[]
    }
    context?: string
}

export class FileManagerPlugin implements RspackPluginInstance {
    private options: FileManagerOptions
    private outputPath: string

    constructor(options: FileManagerOptions) {
        this.options = { context: process.cwd(), ...options }
        this.outputPath = ''
    }

    apply(compiler: Compiler) {
        compiler.hooks.afterEnvironment.tap('FileManagerPlugin', () => {
            this.outputPath = compiler.options.output.path || 'dist'
        })

        compiler.hooks.done.tapPromise('FileManagerPlugin', async () => {
            if (this.options.events.onEnd) {
                for (const op of this.options.events.onEnd) {
                    await this.processOperation(op)
                }
            }
        })
    }

    private async processOperation(operation: Operation) {
        const entries = Object.entries(operation) as OperationEntry<keyof Operation>[]
        for (const [type, value] of entries) {
            switch (type) {
                case 'delete':
                    await this.deleteFiles(value as Exclude<Operation['delete'], undefined>)
                    break
                case 'copy':
                    for (const { source, destination } of value as Exclude<Operation['copy'], undefined>) {
                        await this.copyFile(source, destination)
                    }
                    break
                case 'archive':
                    for (const { source, destination } of value as Exclude<Operation['archive'], undefined>) {
                        await this.createArchive(source, destination)
                    }
                    break
            }
        }
    }

    private async deleteFiles(paths: string[]) {
        await Promise.all(paths.map(async p => {
            const fullPath = this.resolvePath(p)
            if (fs.existsSync(fullPath)) {
                fs.rmSync(fullPath, { recursive: true, force: true })
            }
        }))
    }

    private async copyFile(src: string, dest: string) {
        const source = this.resolvePath(src)
        const target = this.resolvePath(dest)

        if (!fs.existsSync(source)) return

        const dir = path.dirname(target)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        if (fs.statSync(source).isDirectory()) {
            this.copyDirSync(source, target)
        } else {
            fs.copyFileSync(source, target)
        }
    }

    private copyDirSync(src: string, dest: string) {
        fs.mkdirSync(dest, { recursive: true })
        const entries = fs.readdirSync(src, { withFileTypes: true })

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name)
            const destPath = path.join(dest, entry.name)

            entry.isDirectory()
                ? this.copyDirSync(srcPath, destPath)
                : fs.copyFileSync(srcPath, destPath)
        }
    }

    private async createArchive(source: string, dest: string) {
        const zip = new JSZip()
        const sourcePath = this.resolvePath(source)
        const destPath = this.resolvePath(dest)

        if (!fs.existsSync(sourcePath)) return

        const addToZip = (dir: string, zip: JSZip) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true })
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name)
                if (entry.isDirectory()) {
                    const folder = zip.folder(entry.name)
                    addToZip(fullPath, folder!)
                } else {
                    zip.file(
                        entry.name, fs.readFileSync(fullPath),
                        { compression: 'DEFLATE', compressionOptions: { level: 9 } },
                    )
                }
            }
        }

        addToZip(sourcePath, zip)
        const content = await zip.generateAsync({ type: 'nodebuffer' })

        fs.mkdirSync(path.dirname(destPath), { recursive: true })
        fs.writeFileSync(destPath, content)
    }

    private resolvePath(target: string) {
        return path.resolve(
            this.options.context!,
            target.replace(/\$\{outputPath\}/g, this.outputPath)
        )
    }
}