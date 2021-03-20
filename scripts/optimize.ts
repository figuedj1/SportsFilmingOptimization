import Camera from "../src/model/Camera";
import Coordinate from "../src/model/Coordinate";
import Field from "../src/model/Field";
import { Pole } from "../src/model/Pole";
import { degreesToRadians, radiansToDegrees } from "../src/util/MathFuncs";

// in meters / px
const TARGET_GSD = 0.01

// --- Environment ---
// all following dimension measurements are in meters

// Field constructor: (origin, width, height)
const field: Field = Field.fromPosition(Coordinate.XY(40, 44.5), 110, 69)

// Pole constructor: (origin, height)
const pole: Pole = new Pole(Coordinate.origin, 10) 
const polePos = pole.getPosition()
const poleTopHeight = pole.getTopOfPoleHeight() // pole origin Z + height

// Ximea 4K
const camera: Camera = new Camera({
    sensorHeight: 10.3776,
    sensorWidth: 14.1864,
    sensorXResolution: 4112,
    sensorYResolution: 3008,
    position: Coordinate.zero,
    focalDistance: 20,
    yaw: 0,
    pitch: 0,
    poleHeight: 15,
})
camera.mountToPoleTop(pole)

// --- Optimization ---
var furthestDistance = 0
var closestDistance = Infinity

// Calculate furthest and closest OG distance (see diagram)
field.getPoints().forEach(corner => {
    const distance = polePos.xyDistance(corner)
    if (distance > furthestDistance) {
        furthestDistance = distance
    } 
    
    if (distance < closestDistance) {
        closestDistance = distance
    }
})

// GSD Equations

// these two are used to determine the maximum height that a given GSD measurement can be achieved from
const maxHeightForGSDX = (gsdx: number, minimumAngle: number) => {
    return (gsdx*camera.getXResolution()*Math.cos(minimumAngle))/(2*Math.tan(camera.getHorizontalFOV()/2.0))
}

const maxHeightForGSDY = (gsdy: number, minimumAngle: number) => {
    return (gsdy*camera.getYResolution())/(Math.tan(minimumAngle+camera.getVerticalFOV()/2.0) - Math.tan(minimumAngle-camera.getVerticalFOV()/2.0))
}

// These two equations take a target GSD and a pole height and calculate the elevation
// required to achieve that target GSD from the specified height

const elevationForGSDXAndHeight = (gsdx: number, height: number) => {
    const hFOV = camera.getHorizontalFOV()/2.0
    const xRes = camera.getXResolution()
    return Math.acos( (2*Math.tan(camera.getHorizontalFOV()/2.0)*height) / (gsdx*camera.getXResolution()) )
}

const elevationForGSDYAndHeight = (gsdy: number, height: number) => {
    return (1/2)*Math.acos(((2*height*Math.sin(camera.getVerticalFOV()))/(gsdy*camera.getYResolution()))-Math.cos(camera.getVerticalFOV()))
}

const minElevation = degreesToRadians(15)
const maxPoleHeightForGSDX = maxHeightForGSDX(TARGET_GSD, minElevation)
const maxPoleHeightForGSDY = maxHeightForGSDY(TARGET_GSD, minElevation)

// There is a maximum height for any GSD X/Y value where it isn't possible to reach the target GSD if you go
// higher than that value. Therefore, this finds the highest pole height possible that will allow for the given
// GSD measurement

const targetPoleHeight = Math.min(maxPoleHeightForGSDX, maxPoleHeightForGSDY, poleTopHeight)
const maxElevation = Math.atan(furthestDistance/targetPoleHeight) - camera.getVerticalFOV()/2.0

const xElevation = elevationForGSDXAndHeight(TARGET_GSD, targetPoleHeight)
const yElevation = elevationForGSDYAndHeight(TARGET_GSD, targetPoleHeight)

const calculatedElevation = Math.min(maxElevation, Math.max(xElevation, yElevation))


// Calculate the maximum elevation angle from the maximum field corner, because there's
// no reason to pitch the camera more than the fields furthest corner; you'd get less
// surface area.

console.log(furthestDistance)

console.log("Target GSD:", TARGET_GSD, "m/px")
console.log("")
console.log("Pole Height:", pole.getHeight(), "m")
console.log("Max pole height to achieve target GSD X:", maxPoleHeightForGSDX, "m")
console.log("Max pole height to achieve target GSD Y:", maxPoleHeightForGSDY, "m")
console.log("Target height:", targetPoleHeight, "m")
console.log("")

console.log("Minimum camera elevation:", radiansToDegrees(minElevation), "deg")
console.log("Max camera elevation:", radiansToDegrees(maxElevation), "deg")
console.log("Elevation for Target X GSD:", radiansToDegrees(xElevation), "deg", xElevation > maxElevation ? "[unachievable!]" : "")
console.log("Elevation for Target Y GSD:", radiansToDegrees(yElevation), "deg", yElevation > maxElevation ? "[unachievable!]" : "")

if (maxElevation < Math.max(xElevation, yElevation)) {
    console.error("error:", "Target GSD cannot be achieved (max gsd elevation exceeds max camera elevation)")
} else {
    console.log("Least amount of elevation to achieve GSD", radiansToDegrees(calculatedElevation), "deg")
}



