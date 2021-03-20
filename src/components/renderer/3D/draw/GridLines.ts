import { MeshVAO, createMeshVAO } from "../shaders/ShaderUtility";
import Color from "../../Color";

export function createGridMesh(gl: WebGL2RenderingContext, range: number, z:number, spacing: number, subspacing?: number): MeshVAO {
    var vertexArray:number[] = []
    var colorArray:number[] = []
    
    if (subspacing !== undefined) {
        // Draw x lines
        for (var y = -range; y<=range; y += subspacing) {
            if (y % spacing == 0) continue
            vertexArray.push(-range, y, z, range, y, z)
            colorArray.push(...Color.gray.fillF32ArrayOfSize(2))
        }
        
        // Draw y lines
        for (var x = -range; x<=range; x += subspacing) {
            if (x % spacing == 0) continue
            vertexArray.push(x, -range, z, x, range, z)
            colorArray.push(...Color.gray.fillF32ArrayOfSize(2))
        }
    }

    // Draw x lines and colored x axis
    for (var y = -range; y<=range; y += spacing) {
        vertexArray.push(-range, y, z, range, y, z)
        colorArray.push(...(y == 0 ? Color.red.fillF32ArrayOfSize(2) : Color.white.fillF32ArrayOfSize(2)))
    }
    
    // Draw y lines and colored y axis
    for (var x = -range; x<=range; x += spacing) {
        vertexArray.push(x, -range, z, x, range, z)
        colorArray.push(...(x == 0 ? Color.green.fillF32ArrayOfSize(2) : Color.white.fillF32ArrayOfSize(2)))
    }

    // Draw colored z axis
    vertexArray.push(0,0,-range,0,0,range)
    colorArray.push(...Color.blue.fillF32ArrayOfSize(2))

    var vao = createMeshVAO(gl, null, new Float32Array(vertexArray), new Float32Array(colorArray))
    return vao
}