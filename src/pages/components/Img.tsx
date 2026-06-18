import { useState } from '@hooks'
import { type CSSProperties, defineComponent, watch } from 'vue'

export type ImgProps = Partial<Pick<HTMLImageElement, 'src' | 'alt' | 'title'>> & {
    style?: CSSProperties
    onError?: ArgCallback<Event>
    size?: number
}
export const ALL_IMG_PROPS: (keyof ImgProps)[] = ['src', 'alt', 'title', 'style', 'onError', 'size']

const Img = defineComponent<ImgProps>(props => {
    const [imgErr, setImgErr] = useState(false)
    watch(() => props.src, () => setImgErr(false))
    const handleError = (event: Event) => {
        setImgErr(true)
        props?.onError?.(event)
    }

    return () => !props.src || imgErr.value ? null : (
        <img
            src={props.src}
            alt={props.alt}
            title={props.title}
            onError={handleError}
            width={props.size}
            height={props.size}
            style={props.style}
        />
    )
}, { props: ALL_IMG_PROPS })

export default Img