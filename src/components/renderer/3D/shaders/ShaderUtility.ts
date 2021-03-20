/**
 * Creates a WebGL vertex/fragment shader
 * 
 * @see https://www.youtube.com/watch?v=J9NC6Zf2uk4
 * @param gl WebGL2 context
 * @param src Source code for shader in glsl format
 * @param type Specify vertex / fragment shader
 */

import Coordinate from "../../../../model/Coordinate"
import { ATTR_POSITION_LOC, ATTR_POSITION_NAME, ATTR_COLOR_LOC, ATTR_COLOR_NAME } from "../GLUtilities"

export function createShader(gl: WebGL2RenderingContext, src: string, type: "vertex" | "fragment"): WebGLShader {
    var shader = gl.createShader(type == "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER)
    gl.shaderSource(shader, src)
    gl.compileShader(shader)

    // Checks if shaders failed to compile
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader of type " + type + " failed to compile: " + gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
    }

    return shader
}

/**
 * Create a WebGL program
 * 
 * @see https://www.youtube.com/watch?v=J9NC6Zf2uk4
 * @param gl WebGl2 context
 * @param vertexShader A vertex shader
 * @param fragmentShader A fragment shader
 * @param validate Whether to validate the program for aditional debugging. Is expensive, so should only be used during development.
 */

export function createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader, validate: boolean): WebGLProgram {
    var program = gl.createProgram()

    // Attach shaders
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)

    gl.bindAttribLocation(program, ATTR_POSITION_LOC, ATTR_POSITION_NAME)
    gl.bindAttribLocation(program, ATTR_COLOR_LOC, ATTR_COLOR_NAME)

    gl.linkProgram(program)

    // Check if successful
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Error creating GL program: " + gl.getProgramInfoLog(program))
        gl.deleteProgram(program)
        return null
    }

    // Validate for additional debugging
    if (validate) {
        gl.validateProgram(program)
        if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
            console.error("Error validating GL program:", gl.getProgramInfoLog(program))
            gl.deleteProgram(program)
            return null
        }
    }

    // Delete shaders as program has been created
    gl.detachShader(program, vertexShader)
    gl.detachShader(program, fragmentShader)
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    
    return program
}

export function createArrayBufferWithVerticies(gl: WebGL2RenderingContext, verticies: Float32Array, isStatic?: boolean): WebGLBuffer {
    var buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticies,
        (isStatic ?? "true") ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW,
    )
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    return buffer
}

export interface MeshVAO {
    drawMode: number
    vertexArray?: WebGLVertexArrayObject,
    vertexCount?: number,
    vertexComponentLength?: number, 
    vertexBuffer?: WebGLBuffer,
    uvBuffer?: WebGLBuffer,
    indexBuffer?: WebGLBuffer,
    indexCount?: number,
    colorBuffer?: WebGLBuffer
}

/**
 * Create mesh vertex object. By default, it will connect the points via lines. 
 * @param gl WebGL2 Context
 * @param indexArray Index array, specify how you want the points to be connected
 * @param vertArray 
 * @param vertColorArray 
 */

export function createMeshVAO(gl: WebGL2RenderingContext, indexArray: Uint16Array, vertArray: Float32Array, vertColorArray?: Float32Array): MeshVAO {
    const vertexArray = gl.createVertexArray()
    var mesh: MeshVAO = {
        vertexArray: vertexArray,
        drawMode: gl.LINES,
    }
    gl.bindVertexArray(vertexArray)

    if (vertArray !== null) {
        var vertexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.STATIC_DRAW)
        gl.enableVertexAttribArray(ATTR_POSITION_LOC)
        gl.vertexAttribPointer(ATTR_POSITION_LOC, 3, gl.FLOAT, false, 0, 0)
        mesh.vertexCount = vertArray.length / 3
        mesh.vertexComponentLength = 3
        mesh.vertexBuffer = vertexBuffer
    }

    if (vertColorArray != null && vertColorArray !== undefined) {
        var colorBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, vertColorArray, gl.STATIC_DRAW)
        gl.enableVertexAttribArray(ATTR_COLOR_LOC)
        gl.vertexAttribPointer(ATTR_COLOR_LOC, 3, gl.FLOAT, false, 3*Float32Array.BYTES_PER_ELEMENT, 0)
        mesh.colorBuffer = colorBuffer
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    
    if (indexArray != null) {
        var indexBuffer = gl.createBuffer()
        mesh.indexBuffer = indexBuffer
        mesh.indexCount = indexArray.length
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)

    }

    gl.bindVertexArray(null)

    return mesh
}

export class Shader {
    
    gl: WebGL2RenderingContext
    program: WebGLProgram
    
    constructor(gl: WebGL2RenderingContext, vertSrc: string, fragSrc: string, validate?: boolean) {
        this.gl = gl

        var vertexShader = createShader(gl, vertSrc, "vertex")
        var fragmentShader = createShader(gl, fragSrc, "fragment")
        this.program = createProgram(gl, vertexShader, fragmentShader, validate ?? false)
    
        if (this.program != null) {
            // no compile issues
            this.gl.useProgram(this.program)
        }
    }

    activate() {
        this.gl.useProgram(this.program)
    }

    deactivate() {
        this.gl.useProgram(null)
    }

    dispose() {
        if (this.gl.getParameter(this.gl.CURRENT_PROGRAM) === this.program) {
            this.deactivate()
        }
        this.gl.deleteProgram(this.program)
    }

    renderMesh(mesh: MeshVAO) {
        if (mesh != null) {
            this.gl.bindVertexArray(mesh.vertexArray)
            if (mesh.indexBuffer != null) {
                this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer)
                this.gl.drawElements(mesh.drawMode, mesh.indexCount, this.gl.UNSIGNED_SHORT, 0)
                this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null)
            } else {
                this.gl.drawArrays(mesh.drawMode, 0, mesh.vertexCount)
            }
            
            this.gl.bindVertexArray(null)   
        }
    }


}