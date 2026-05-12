import qrcode from 'qrcode-generator'

type GenerateQrCanvasOption = {
    text: string
    size: number
    margin?: number
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

export function generateQrCanvas(option: GenerateQrCanvasOption): HTMLCanvasElement {
    const { text, size, margin = 1, errorCorrectionLevel = 'M' } = option
    const qr = qrcode(0, errorCorrectionLevel)
    qr.addData(text)
    qr.make()

    const moduleCount = qr.getModuleCount()
    const totalModules = moduleCount + margin * 2
    const scale = Math.max(1, Math.floor(size / totalModules))
    const canvasSize = totalModules * scale

    const canvas = document.createElement('canvas')
    canvas.width = canvasSize
    canvas.height = canvasSize
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to create QR canvas context')

    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvasSize, canvasSize)
    ctx.fillStyle = '#000'

    for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
            if (!qr.isDark(row, col)) continue
            ctx.fillRect((col + margin) * scale, (row + margin) * scale, scale, scale)
        }
    }

    return canvas
}

export function generateQrDataUrl(option: GenerateQrCanvasOption): string {
    return generateQrCanvas(option).toDataURL('image/png')
}
