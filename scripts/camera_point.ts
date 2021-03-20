import Camera, { CameraProperties } from "../src/model/Camera";
import Coordinate from "../src/model/Coordinate";
import { radiansToDegrees } from "../src/util/MathFuncs";

const base_camera_properties: CameraProperties = {
    sensorHeight: 10.3776,
    sensorWidth: 14.1864,
    sensorXResolution: 4112,
    sensorYResolution: 3008,
    position: Coordinate.XY(5, 10),
    focalDistance: 20,
    yaw: 0,
    pitch: 0,
    poleHeight: 15,
}

const camera = new Camera(base_camera_properties)
const targetPoint = Coordinate.XY(20, 20)
camera.pointAt(targetPoint)
console.log(camera.getPosition())
console.log(targetPoint)
console.log(radiansToDegrees(camera.getCameraProperties().yaw))