import { glMatrix, mat4, vec3 } from 'gl-matrix';
import React, { useCallback, useRef, useState } from 'react';
import Coordinate from '../../../model/Coordinate';
import { EventEnvironment } from '../../../model/WrappedEventModel';
import { useEnvironment } from '../../Providers';
import { EditorState, useEditorState } from '../../providers/Editor';
import { CanvasController } from '../CanvasController';
import Color from '../Color';
import { getCameraConeVAOsFromEnvironment, getProjectionVAOsFromEnvironment } from './draw/CameraDrawer';
import { createGridMesh } from './draw/GridLines';
import { clearGL } from './GLUtilities';
import { BasicShader } from './shaders/BasicShader';
import { createMeshVAO, MeshVAO, Shader } from './shaders/ShaderUtility';
import VertexShader from './shaders/ts/VertexShader';

function initializeCanvas(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2");

    gl.enable(gl.DEPTH_TEST)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.viewport(0,0,canvas.width,canvas.height)
    if (gl === null) {
        alert("no webgl2 support")
        return;
    } 	               
}

var cachedGridMesh: MeshVAO = null

function render(canvas: HTMLCanvasElement, meshCache: React.MutableRefObject<Record<MeshTypes, MeshVAO>>, environment: EventEnvironment, editor: EditorState, shader: Shader, camLoc: vec3, camFocus: vec3) {
    const gl = canvas.getContext("webgl2");
    
    shader.activate()

    gl.clearColor(0,0,0,1)
    clearGL(gl)

    var worldMatrix = new Float32Array(16);
    var viewMatrix = new Float32Array(16);
    var projMatrix = new Float32Array(16);
    
    // Setup matrixs
    mat4.identity(worldMatrix)
    mat4.lookAt(viewMatrix, camLoc, camFocus, Coordinate.up.vec3())
    mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 1000)

    gl.uniformMatrix4fv(VertexShader.getUniformLocation(gl, shader.program, "worldMatrix"), false, worldMatrix)
    gl.uniformMatrix4fv(VertexShader.getUniformLocation(gl, shader.program, "viewMatrix"), false, viewMatrix)
    gl.uniformMatrix4fv(VertexShader.getUniformLocation(gl, shader.program, "projMatrix"), false, projMatrix)

    var fieldMesh = createMeshVAO(gl, new Uint16Array([0,1,3,1,2,3]), Coordinate.toFloat32Array(environment.getField().getPoints()), Color.darkGreen.fillF32ArrayOfSize(4))
    fieldMesh.drawMode = gl.TRIANGLES 
    
    if (meshCache.current.grid == null) {
        meshCache.current.grid = createGridMesh(gl, 50, -0.05, 5, 1)
    }
    
    shader.renderMesh(meshCache.current.grid)
    shader.renderMesh(fieldMesh)

    var selectedObjectId = "none"
    if (editor.currentSelectedObject != null) {
        selectedObjectId = editor.currentSelectedObject.id
    }


    getProjectionVAOsFromEnvironment(gl, environment, 0, selectedObjectId).forEach(vao => {
        shader.renderMesh(vao)
    })

    getCameraConeVAOsFromEnvironment(gl, environment, 0, selectedObjectId).forEach(vao => {
        shader.renderMesh(vao)
    })
    shader.deactivate()

}


interface EnvironmentRenderer3DProps {

}

type MeshTypes = "grid" | "camera"
export const EnvironmentRenderer3D: React.FC<EnvironmentRenderer3DProps> = ({}) => {
        const environment = useEnvironment();
        const editor = useEditorState()

        const meshCacheRef = useRef<Record<MeshTypes, MeshVAO>>({"grid": null} as Record<MeshTypes, MeshVAO>)
        const [shader, setShader] = useState<Shader>(null)

        const [cameraLocation, setCameraLocation] = useState<vec3>(Coordinate.XYZ(0,-20,20).vec3())
        const [cameraFocus, setCameraFocus] = useState<vec3>(Coordinate.zero.vec3())

        const initializeCallback = useCallback((canvas: HTMLCanvasElement) => {
            if (shader === null) {
                setShader(new BasicShader(canvas.getContext("webgl2")))
            } else {
                initializeCanvas(canvas)
            }
            
        }, [shader])

        const renderCallback = useCallback((canvas: HTMLCanvasElement) => {
            if (shader !== null) {
                render(canvas, meshCacheRef, environment, editor, shader, cameraLocation, cameraFocus)
            }
        }, [shader, environment, editor, cameraLocation, cameraFocus])


        const scrollCallback = useCallback((e: WheelEvent) => {
            const isScrollingUp = e.deltaY < 0
            const scaleInterval = 4/5
            const scale = isScrollingUp ? scaleInterval : 1/scaleInterval
            setCameraLocation(prevVec3 => {
                var newVec3: vec3 = [0,0,0]
                vec3.scale(newVec3, prevVec3, scale)
                return newVec3
            })
        }, [])

        const dragCallback = useCallback((deltaX: number, deltaY: number) => {
            setCameraLocation(prevLocation => {
                var newLoc = vec3.create()
                vec3.copy(newLoc, prevLocation)
                
                // Get normalized camera direction
                var cameraDirection: vec3 = [0,0,0]
                vec3.subtract(cameraDirection, prevLocation, cameraFocus)
                vec3.normalize(cameraDirection, cameraDirection)

                // Get camera's right vector, which will be used to pitch the camera up/down
                var up = vec3.create()
                var right = vec3.create()
                vec3.cross(right, cameraDirection, Coordinate.up.vec3())
                vec3.cross(up, cameraDirection, right)

                // Perform rotations
                var yawMat = mat4.create()
                var pitchMat = mat4.create()
                mat4.fromRotation(yawMat, -deltaX/100, Coordinate.up.vec3())
                mat4.fromRotation(pitchMat, deltaY/100, right)
                vec3.transformMat4(newLoc, newLoc, yawMat)
                vec3.transformMat4(newLoc, newLoc, pitchMat)

                return newLoc
            })
            
        }, [cameraLocation, cameraFocus])

        // Update rendering functions on editor or scale change
        return (<CanvasController initializeCanvas={initializeCallback} render={renderCallback} onScroll={scrollCallback} onDrag={dragCallback} />);
}