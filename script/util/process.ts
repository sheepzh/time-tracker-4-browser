
/**
 * @throws Will invoke ```process.exit()```
 */
export function exitWith(msg: string): never {
    console.error(msg)
    process.exit()
}