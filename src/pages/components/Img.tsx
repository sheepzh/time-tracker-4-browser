import { useState } from '@hooks'
import { type CSSProperties, defineComponent, watch } from 'vue'

export type ImgProps = Partial<Pick<HTMLImageElement, 'src' | 'alt' | 'title'>> & {
    style?: CSSProperties
    onLoad?: ArgCallback<Event>
    onError?: ArgCallback<Event>
    size?: number
}
export const ALL_IMG_PROPS: (keyof ImgProps)[] = ['src', 'alt', 'title', 'style', 'onLoad', 'onError', 'size']

export default defineComponent<ImgProps>((props, ctx) => {
    const [imgErr, setImgErr] = useState(false)
    watch(() => props.src, () => setImgErr(false))
    const handleError = (event: Event) => {
        setImgErr(true)
        props?.onError?.(event)
    }

    // Fallback to default slot when image fails to load or src is not provided
    return () => !props.src || imgErr.value ? ctx.slots.default?.() : (
        <img
            src={props.src}
            alt={props.alt}
            title={props.title}
            onLoad={props.onLoad}
            onError={handleError}
            width={props.size}
            height={props.size}
            style={props.style}
        />
    )
}, { props: ALL_IMG_PROPS })