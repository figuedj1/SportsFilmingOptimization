import Coordinate from "../../../../model/Coordinate";
import Environment from "../../../../model/Environment";
import { EventCamera, EventEnvironment } from "../../../../model/WrappedEventModel";
import Color from "../../Color";
import { createMeshVAO, MeshVAO } from "../shaders/ShaderUtility";

export function getProjectionVAOsFromEnvironment(gl: WebGL2RenderingContext, environment: EventEnvironment, z: number, selectedCamera?: string): MeshVAO[] {
    var vaos: MeshVAO[] = []
    
    environment.getCameras().forEach(camera => {
        var id = camera.id
        var cameraSelected = selectedCamera === id
        var color = Color.yellow
        if (camera.getCameraProperties().color) {
            if (camera.getCameraProperties().color) {
                let new_color = Color.fromHexString(camera.getCameraProperties().color)
                if (new_color) {
                    color = new_color
                }
            }
        }
        vaos.push(getCameraProjectionVAO(gl, camera, z, cameraSelected ? color : Color.gray))
    })

    return vaos
}

export function getCameraConeVAOsFromEnvironment(gl: WebGL2RenderingContext, environment: EventEnvironment, z: number, selectedCamera?: string): MeshVAO[] {
    var vaos: MeshVAO[] = []
    
    environment.getCameras().forEach(camera => {
        var id = ""
        var color = Color.yellow
        if (camera instanceof EventCamera) {
            id = camera.id
            if (camera.getCameraProperties().color) {
                let new_color = Color.fromHexString(camera.getCameraProperties().color)
                if (new_color) {
                    color = new_color
                }
            }
        }
        var cameraSelected = selectedCamera === id
        vaos.push(cameraConeVAO(gl, camera, z, color))
    })

    return vaos
}

export function getCameraProjectionVAO(gl: WebGL2RenderingContext, camera: EventCamera, z: number, color: Color): MeshVAO {
    // Don't create a mesh for the camera if it has been marked as not visible
    let visible = camera.getCameraProperties().visible
    if (!visible) {
        return null
    }

    var projectionCoordinates = camera.project()
    // Set all projection coordinates' z level to the z level specified in the function
    projectionCoordinates.forEach(element => {
        element.z = z
    })

    var vao = createMeshVAO(gl, new Uint16Array([0,1,2,3,0,3,1,2]), Coordinate.toFloat32Array(projectionCoordinates), color.fillF32ArrayOfSize(projectionCoordinates.length))
    return vao
}

export function cameraConeVAO(gl: WebGL2RenderingContext, camera: EventCamera, z: number, color: Color): MeshVAO {
    // Don't create a mesh for the camera if it has been marked as not visible
    let visible = camera.getCameraProperties().visible
    if (!visible) {
        return null
    }
    
    var projectionCoordinates = camera.project()
    var cameraOrigin = camera.getCameraProperties().position
    // Set all projection coordinates' z level to the z level specified in the function
    projectionCoordinates.forEach(element => {
        element.z = z
    })

    var coordinates = [cameraOrigin, ...projectionCoordinates]

    var vao = createMeshVAO(gl,
            new Uint16Array([0,1,0,2,0,3,0,4]),
            Coordinate.toFloat32Array(coordinates),
            color.fillF32ArrayOfSize(coordinates.length)
        )
    
    return vao

}