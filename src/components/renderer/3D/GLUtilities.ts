import { createShader, createProgram } from "./shaders/ShaderUtility"
import VertexShader from "./shaders/ts/VertexShader"
import FragmentShader from "./shaders/ts/FragmentShader"
export const ATTR_POSITION_LOC = 0
export const ATTR_POSITION_NAME = "a_position"
export const ATTR_COLOR_LOC = 1
export const ATTR_COLOR_NAME = "a_color"

 /**
 * Creates a GL program. This is expensive and only needs to be called once rather than every render or every time the window is resized.
 * @param gl WebGL2 Context
 * @returns The WebGL program
 */

export function createGLProgram(gl: WebGL2RenderingContext): WebGLProgram {
    console.log("Creating GL program...")
    let vShader = createShader(gl, VertexShader.src, "vertex")
    let fShader = createShader(gl, FragmentShader.src, "fragment")
    let program = createProgram(gl, vShader, fShader, true)
    return program
}

/**
 * Completely clear a GL canvas
 * @param gl WebGL2 Context
 */
export function clearGL(gl: WebGL2RenderingContext) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
}

