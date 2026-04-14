export function processDir(dirPath: string | undefined): string {
    dirPath = dirPath?.trim?.()
    if (!dirPath) {
        return ''
    }
    while (dirPath.startsWith("/")) {
        dirPath = dirPath.substring(1)
    }
    if (!dirPath.endsWith("/")) {
        dirPath = dirPath + '/'
    }
    return dirPath
}