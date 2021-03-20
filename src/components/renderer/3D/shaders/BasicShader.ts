import { Shader, MeshVAO } from "./ShaderUtility";
import VertexShader from "./ts/VertexShader";
import FragmentShader from "./ts/FragmentShader";

export class BasicShader extends Shader {
    constructor(gl: WebGL2RenderingContext) {
        super(gl, VertexShader.src, FragmentShader.src, true)
        this.gl.useProgram(null)

    }

    renderMesh(mesh: MeshVAO) {
        super.renderMesh(mesh)
    }
}