import { useState } from '@hooks'
import { type CSSProperties, defineComponent, toRef } from 'vue'

type Props = Partial<Pick<HTMLImageElement, 'src' | 'alt' | 'title'>> & {
    style?: CSSProperties
    onError?: ArgCallback<Event>
    size?: number
}

const Img = defineComponent<Props>(props => {
    const src = toRef(props, 'src')
    const [imgErr, setImgErr] = useState(false)
    const handleError = (event: Event) => {
        setImgErr(true)
        props?.onError?.(event)
    }

    return () => !src.value || imgErr.value ? null : (
        <img
            src={src.value}
            alt={props.alt}
            title={props.title}
            onError={handleError}
            width={props.size}
            height={props.size}
            style={props.style}
        />
    )
}, { props: ['src', 'alt', 'size', 'style', 'title', 'onError'] })

export default Img