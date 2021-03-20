import { vec2 } from "gl-matrix";
import Camera, { CameraProperties } from "../src/model/Camera";
import Coordinate from "../src/model/Coordinate";
import Field from "../src/model/Field";
import { Pole } from "../src/model/Pole";
import { radiansToDegrees } from "../src/util/MathFuncs";

// --- Environment ---
// all following dimension measurements are in meters

// Field constructor: (origin, width, height)
// const field: Field = Field.fromPosition(Coordinate.XY(40, 44.5), 110, 69)
const field: Field = Field.fromPosition(Coordinate.origin, 110, 69)

const POLE_HEIGHT = 10
// const POLE_LOCATIONS: Coordinate[] = [
//     Coordinate.XY(0,0),
//     Coordinate.XY(20,0),
//     Coordinate.XY(40,0),
//     Coordinate.XY(-20, 30),
//     Coordinate.XY(100, 60)
// ]

const POLE_LOCATIONS: Coordinate[] = [
    Coordinate.XY(60, 30),
    Coordinate.XY(60, -15),
    Coordinate.XY(-60,-30),
    Coordinate.XY(-60,15),
    Coordinate.XY(-40, 40),
    Coordinate.XY(-25, 40),
    Coordinate.XY(25, -40),
    Coordinate.XY(40, -40)
]

var poles: Pole[] = []

POLE_LOCATIONS.forEach(location => {
    poles.push(new Pole(location, POLE_HEIGHT))
})

// Ximea 4K*
const base_camera_properties: CameraProperties = {
    sensorHeight: 10.3776,
    sensorWidth: 14.1864,
    sensorXResolution: 4112,
    sensorYResolution: 3008,
    position: Coordinate.zero,
    focalDistance: 20,
    yaw: 0,
    pitch: 0,
    poleHeight: 15,
}

var cameras: Camera[] = []
poles.forEach(pole => {
    const camera = new Camera(base_camera_properties)
    camera.mountToPoleTop(pole)
    cameras.push(camera)
})

console.log(base_camera_properties, "\n")

function lineFromCoordinates(c1: Coordinate, c2: Coordinate): ((x: number) => number) {
    console.log(c1,c2)
    const slope = (c2.y - c1.y) / (c2.x - c1.x) 
    return (x: number) => (slope * (x - c1.x)) + c1.y
}

const fieldPoints = field.getBoundPoints()
const otherFieldPoints = field.getAlternateBoundPoints()

const lineBetweenCorners = lineFromCoordinates(fieldPoints[0], fieldPoints[1])
const lineBetweenOtherCorners = lineFromCoordinates(otherFieldPoints[0], otherFieldPoints[1])
var topBottomCameras: Camera[] = []
var leftRightCameras: Camera[] = []

cameras.forEach(camera => {
    const cameraX = camera.getPosition().x
    const cameraY = camera.getPosition().y
    if ((cameraY >= lineBetweenCorners(cameraX) && cameraY >= lineBetweenOtherCorners(cameraX)) || 
        (cameraY <= lineBetweenCorners(cameraX) && cameraY <= lineBetweenOtherCorners(cameraX))) {
        // Camera is between top and bottom
        topBottomCameras.push(camera)
    } else {
        // Camera is left and right
        leftRightCameras.push(camera)
    }
})

const verticalSubdivisions = leftRightCameras.length
const horizontalSubdivisions = topBottomCameras.length
const fieldWidth = field.getWidth()
const fieldHeight = field.getHeight()
const middleFieldX = fieldPoints[0].x + (fieldWidth / 2)
const middleFieldY = fieldPoints[0].y + (fieldHeight / 2)
var verticalCoordinates: Coordinate[] = []
var horizontalCoordinates: Coordinate[] = []

const verticalSubdivisionLength = fieldHeight/(verticalSubdivisions+1)
const horizontalSubdivisionLength = fieldWidth/(horizontalSubdivisions+1)
var remainingLeftRightCameras = [...leftRightCameras]
var remainingTopBottomCameras = [...topBottomCameras]
remainingTopBottomCameras.sort((a, b) => a.getPosition().x - b.getPosition().x)
remainingLeftRightCameras.sort((a, b) => a.getPosition().y - b.getPosition().y)


console.log(verticalSubdivisionLength, verticalSubdivisions, fieldHeight, fieldPoints[0].y, fieldPoints[1].y)

for (let i = 1; i < verticalSubdivisions+1; i++) {
    const subdivisionPoint = Coordinate.XY(middleFieldX, fieldPoints[0].y + i*verticalSubdivisionLength)
    verticalCoordinates.push (subdivisionPoint)
    const camera = remainingLeftRightCameras[i-1]
    camera.pointAt(subdivisionPoint)

    // let closestCameraDistance: number = Infinity
    // let closestCameraIndex: number
    // remainingLeftRightCameras.forEach((camera, index) => {
    //     const distance = camera.getPosition().xyDistance(subdivisionPoint)
    //     // const distance = Math.abs(camera.getPosition().x - subdivisionPoint.x)
    //     if (distance < closestCameraDistance) {
    //         closestCameraDistance = distance
    //         closestCameraIndex = index
    //     }
    // })

    // const closestCamera: Camera = remainingLeftRightCameras[closestCameraIndex]
    // closestCamera.pointAt(subdivisionPoint)
    // remainingLeftRightCameras.splice(closestCameraIndex, 1)
}

for (let i = 1; i < horizontalSubdivisions+1; i++) {
    const subdivisionPoint = Coordinate.XY(fieldPoints[0].x + i*horizontalSubdivisionLength, middleFieldY)
    horizontalCoordinates.push(subdivisionPoint)
    const camera = remainingTopBottomCameras[i-1]
    camera.pointAt(subdivisionPoint)

    // let closestCameraDistance: number = Infinity
    // let closestCameraIndex: number
    // remainingTopBottomCameras.forEach((camera, index) => {
    //     const distance = camera.getPosition().xyDistance(subdivisionPoint)
    //     if (distance < closestCameraDistance) {
    //         closestCameraDistance = distance
    //         closestCameraIndex = index
    //     }
    // })

    // const closestCamera: Camera = remainingTopBottomCameras[closestCameraIndex]
    // closestCamera.pointAt(subdivisionPoint)
    // remainingTopBottomCameras.splice(closestCameraIndex, 1)
}

console.log("\nVertical Subdivision Points\n")
verticalCoordinates.forEach(point => {
    console.log(point)
})

console.log("\nHorizontal Subdivision Points\n")
horizontalCoordinates.forEach(point => {
    console.log(point)
})

console.log("\nTop/Bottom Cameras\n")
topBottomCameras.forEach(camera => {
    console.log(camera.getPosition(), radiansToDegrees(camera.getCameraProperties().yaw))
})

console.log("\nLeft/Right Cameras\n")
leftRightCameras.forEach(camera => {
    console.log(camera.getPosition(), radiansToDegrees(camera.getCameraProperties().yaw))
})

console.log("\nAll Cameras\n")
cameras.forEach(camera => {
    console.log(camera.getPosition(), radiansToDegrees(camera.getCameraProperties().yaw))
})