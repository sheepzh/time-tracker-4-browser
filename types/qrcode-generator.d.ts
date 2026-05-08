declare module 'qrcode-generator' {
    type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

    type QrCode = {
        addData(data: string): void
        make(): void
        getModuleCount(): number
        isDark(row: number, col: number): boolean
    }

    type QrCodeGenerator = (typeNumber: number, errorCorrectionLevel: ErrorCorrectionLevel) => QrCode

    const qrcode: QrCodeGenerator
    export default qrcode
}
