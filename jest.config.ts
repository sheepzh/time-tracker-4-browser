import { readFileSync } from 'fs'
import type { Config } from "jest"
import { join } from 'path'

const tsconfig = JSON.parse(readFileSync(join(process.cwd(), 'tsconfig.json'), 'utf-8'))
const { compilerOptions } = tsconfig as { compilerOptions: { paths: { [key: string]: string[] } } }

const { paths } = compilerOptions

const aliasPattern = /^(@.*)\/\*$/
const sourcePattern = /^(.*)\/\*$/

const moduleNameMapper: { [key: string]: string } = {}

Object.entries(paths).forEach(([alias, sourceArr]) => {
    const aliasMatch = alias.match(aliasPattern)
    if (!aliasMatch) {
        return
    }
    if (!Array.isArray(sourceArr) || sourceArr.length !== 1) {
        return
    }
    const sourceMath = sourceArr[0]?.match(sourcePattern)
    if (!sourceMath) {
        return
    }
    const prefix = aliasMatch[1]
    const pattern = `^${prefix}/(.*)$`
    const source = sourceMath[1]
    const sourcePath = `<rootDir>/${source}/$1`
    moduleNameMapper[pattern] = sourcePath
})

console.log("The moduleNameMapper parsed from tsconfig.json: ")
console.log(moduleNameMapper)

const config: Config = {
    moduleNameMapper,
    roots: [
        "<rootDir>/test",
        "<rootDir>/test-e2e",
    ],
    testRegex: '(.+)\\.test\\.(jsx?|tsx?)$',
    transform: {
        "^.+\\.tsx?$": "@swc/jest"
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}

export default config