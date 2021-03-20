import React, { useEffect, useRef, useState, useCallback } from 'react';
import Camera from '../../../model/Camera';
import Coordinate from '../../../model/Coordinate';
import { EventEnvironment, EventCamera } from '../../../model/WrappedEventModel';
import { useEnvironment } from '../../Providers';
import { useEditorState, EditorState } from '../../providers/Editor';
import { CanvasController } from '../CanvasController';
import Color from '../Color';
import Field from '../../../model/Field';
import { mod } from '../../../util/MathFuncs';

interface EnvironmentRendererProps {
    style?: React.CSSProperties,
}


function clearTranslatedCanvas(ctx: CanvasRenderingContext2D, color: string) {
    const canvas = ctx.canvas
    ctx.fillStyle = color
    ctx.fillRect(-canvas.width/2, -canvas.height / 2, canvas.width, canvas.height)
}

function initializeCanvas(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, scale: number) {
    const canvas = ctx.canvas
    ctx.translate((canvas.width/2) + offsetX, (canvas.height/2) + offsetY)
    ctx.scale(scale,-scale)
}

function getCanvasScale(ctx: CanvasRenderingContext2D): number {
    const transform = ctx.getTransform()
    return transform.a
}

function drawGridLines(ctx: CanvasRenderingContext2D, spacing: number, width: number, color: string) {
    const transform = ctx.getTransform()
    transform.invertSelf()
    const min = transform.transformPoint(new DOMPoint(0,0))
    const max = transform.transformPoint(new DOMPoint(ctx.canvas.width, ctx.canvas.height))

    ctx.lineWidth = width
    ctx.strokeStyle = color

    // Draw X Lines
    // MIN X value will be the smallest value, so we must add spacing over the loop
    for (var x = min.x + (spacing-mod(min.x, spacing)); x < max.x; x += spacing) {
        ctx.beginPath()        
        ctx.moveTo(x, min.y)
        ctx.lineTo(x, max.y)
        ctx.stroke()
    }

    // Draw Y Lines
    // MIN Y value will be the largest value, so we must subtract spacing over loop
    for (var y = min.y + (spacing-mod(min.y, spacing)); y > max.y; y -= spacing) {
        ctx.beginPath()
        ctx.moveTo(min.x, y)
        ctx.lineTo(max.x, y)
        ctx.stroke()
    }

    
}

function drawAxisLines(ctx: CanvasRenderingContext2D, width: number) {    
    // X Axis
    ctx.beginPath()
    ctx.strokeStyle = Color.red.rgbString()
    ctx.moveTo(-ctx.canvas.width/2, 0)
    ctx.lineTo(ctx.canvas.width/2, 0)
    ctx.stroke()

    // Y Axis
    ctx.beginPath()
    ctx.strokeStyle = Color.green.rgbString()
    ctx.moveTo(0, -ctx.canvas.height/2)
    ctx.lineTo(0, ctx.canvas.height/2)
    ctx.stroke()
}

function drawCoordinatePath(ctx: CanvasRenderingContext2D, coordinates: Coordinate[], width?: number, color?: string) {
    if (width != undefined) {
        ctx.lineWidth = width
    }

    if (color != undefined) {
        ctx.strokeStyle = color
    }

    ctx.beginPath()
    const startPoint = coordinates[0]
    ctx.moveTo(startPoint.x, startPoint.y )
    coordinates.forEach((coord) => {
        ctx.lineTo(coord.x, coord.y)
    })
    ctx.lineTo(startPoint.x, startPoint.y)
    ctx.stroke()
}


function drawCamera(ctx: CanvasRenderingContext2D, camera: EventCamera, camRadius: number, selected: boolean) {
    // Don't draw camera if it's hidden
    var color = Color.gray.rgbString()
    color = camera.getCameraProperties().color
    let visible = camera.getCameraProperties().visible
    if (!visible) return 

    const pos = camera.getCameraProperties().position
    ctx.moveTo(pos.x, pos.y)

    ctx.beginPath()
    const radius = selected ? 2*camRadius : camRadius
    ctx.ellipse(pos.x, pos.y, radius, radius, 0, 0, 360)
    ctx.fillStyle = color
    ctx.fill()

    // drawCameraProjection(ctx, camera.project(), selected ? scaleScreenDistance(ctx, 8) : scaleScreenDistance(ctx, 4), color)
    drawCameraProjection(ctx, camera.project(), selected ? 0.4 : 0.2, color)
}

function drawField(ctx: CanvasRenderingContext2D, field: Field) {
    //drawCoordinatePath(ctx, projection, width, Color.darkGreen.rgbString())
    ctx.beginPath()
    ctx.fillStyle = Color.darkGreen.rgbString()
    const start = field.getLowerLeftCoord()
    const [fWidth, fHeight] = [field.getWidth(), field.getHeight()]
    ctx.fillRect(start.x, start.y, fWidth, fHeight)
}

function drawCameraProjection(ctx: CanvasRenderingContext2D, projection: Coordinate[], width: number, color: string) {
    drawCoordinatePath(ctx, projection, width, color)
}

/**
 * Scale a screen value to the current canvas scale.
 * Useful when you want to keep all lines a certain width regardless of canvas scale
 */
function scaleScreenDistance(ctx: CanvasRenderingContext2D, val: number): number {
    const currentScale = getCanvasScale(ctx)
    return val / currentScale
}

function render(ctx: CanvasRenderingContext2D, environment: EventEnvironment, editor: EditorState) {
    // Clear canvas with a white background color
    clearTranslatedCanvas(ctx, "black")
    
    // Start by drawing grid lines, with black lines every 5 spaces and gray lines every 1 space
    // Then draw x/y axis in black

    drawGridLines(ctx, 1, scaleScreenDistance(ctx, 1), "darkgray")
    drawGridLines(ctx, 5, scaleScreenDistance(ctx, 1), "white")
    drawAxisLines(ctx, scaleScreenDistance(ctx, 2))

    var currentSelectedID = "none"
    if (editor.currentSelectedObject != null) {
        currentSelectedID = editor.currentSelectedObject.id
    }
    
    drawField(ctx, environment.getField())

    environment.getCameras().forEach((camera) => {
        const selected =  camera.id === currentSelectedID
        drawCamera(ctx, camera, scaleScreenDistance(ctx, 6), selected)
    })
}

const SCALE_MIN = 5
const SCALE_MAX = 100

export const EnvironmentRenderer2D: React.FC<EnvironmentRendererProps> = ({style}) => {
        const environment = useEnvironment()
        const editor = useEditorState()
        const [scale, setScale] = useState(30)
        const [offset, setOffset] = useState<[number, number]>([0,0])

        const initCallback = useCallback((canvas: HTMLCanvasElement) => {
            const ctx = canvas.getContext("2d")
            initializeCanvas(ctx, offset[0], offset[1], scale)
        }, [scale, offset])

        const renderCallback = useCallback((canvas: HTMLCanvasElement) => {
            const ctx = canvas.getContext("2d")
            render(ctx, environment, editor)
        }, [environment, editor])

        const scrollCallback = useCallback((e: WheelEvent) => {
            const isScrollingUp = e.deltaY < 0
            setScale(prevScale => Math.min(Math.max(isScrollingUp ? prevScale + 2 : prevScale - 2, SCALE_MIN), SCALE_MAX))
        }, [])

        const dragCallback = useCallback((deltaX: number, deltaY: number) => {
            setOffset(prevOffset => [prevOffset[0] + deltaX, prevOffset[1] + deltaY])
        }, [])

        return (
            <CanvasController initializeCanvas={initCallback} render={renderCallback} onScroll={scrollCallback} onDrag={dragCallback}/>
        );
}