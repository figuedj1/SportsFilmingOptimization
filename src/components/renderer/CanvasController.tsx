import React, { useRef, useEffect } from 'react'
import { useEnvironment } from '../Providers';

interface CanvasControllerProps {
    initializeCanvas: (canvas: HTMLCanvasElement) => void,
    render: (canvas: HTMLCanvasElement) => void,
    onScroll?: (event: WheelEvent) => void,
    onDrag?: (deltaX: number, deltaY: number) => void,
}

export const CanvasController: React.FC<CanvasControllerProps> = ({initializeCanvas, render, onScroll, onDrag}) => {
        const environment = useEnvironment();
        const divRef = useRef<HTMLDivElement>(null);
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const mouseDownRef = useRef(false)

        // Scroll wheel handling
        useEffect(() => {
            divRef.current.addEventListener('wheel', onScroll)
            return () => {
                divRef.current.removeEventListener('wheel', onScroll)
            }
        }, [onScroll])

        // Drag handling
        useEffect(() => {
            const mouseDownCallback = (e: MouseEvent) => {
                mouseDownRef.current = true
            }

            const mouseUpCallback = (e: MouseEvent) => {
                mouseDownRef.current = false
            }

            const mouseMoveCallback = (e: MouseEvent) => {
                if (mouseDownRef.current) {
                    onDrag(e.movementX, e.movementY)
                }
            }

            divRef.current.addEventListener('mousedown', mouseDownCallback)
            divRef.current.addEventListener('mouseup', mouseUpCallback)
            divRef.current.addEventListener('mousemove', mouseMoveCallback)

            return () => {
                divRef.current.removeEventListener('mousedown', mouseDownCallback)
                divRef.current.removeEventListener('mouseup', mouseUpCallback)
                divRef.current.removeEventListener('mousemove', mouseMoveCallback)
            }
        }, [onDrag])

        useEffect(() => {
            const init = () => {
                // Stetch canvas to div width/height
                canvasRef.current.width = divRef.current.offsetWidth
                canvasRef.current.height = divRef.current.offsetHeight

                initializeCanvas(canvasRef.current)
            }

            init()
            render(canvasRef.current)

            // Handle window resizses
            window.onresize = () => {
                init()
                render(canvasRef.current)
                console.log("resize!")
            }


            // Attach event listeners for environment changes
            const envChangeCallback = () => render(canvasRef.current)
            environment.cameraRenderPropsModified.push(envChangeCallback)
            environment.fieldDimensionsModified.push(envChangeCallback)

            return () => {
                // Cleanup environment listeners
                const rmIndexField = environment.fieldDimensionsModified.findIndex(e => e === envChangeCallback)
                const rmIndexRender = environment.cameraRenderPropsModified.findIndex(e => e === envChangeCallback)
                environment.cameraRenderPropsModified.splice(rmIndexRender, 1)
                environment.fieldDimensionsModified.splice(rmIndexField, 1)
            }
        }, [initializeCanvas, render])

        return (
            <div ref={divRef} style={{flex: 1}}>
                <canvas ref={canvasRef} width="1000" height="1000"/>
            </div>
        );
}