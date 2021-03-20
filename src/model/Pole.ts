import Coordinate from "./Coordinate";
import Camera from "./Camera";
import Field from "./Field";
import { vec3, vec2 } from "gl-matrix";
import { pointWithinPolygon, intersection } from "./Geometry";

export interface OptimizationMethodOption {
    key: string,
    name: string,
}
export interface OptimizationMethod {
    name: string,
    description: string,
    optimizer: (camera: Camera, field: Field, options?: Record<string, any>) => void
}

/**
 * A pole for a camera to eventually be mounted on. 
 */
 export class Pole {

    private position_: Coordinate
    private height_: number
    
    /**
     * Create a pole by giving it a position in 3D space.
     * @param position 
     * @param height in meters
     */
    constructor(position: Coordinate, height: number) {
        this.position_ = position
        this.height_ = height
    }

    getHeight(): number {
        return this.height_
    }

    setHeight(height: number) {
        this.height_ = height
    }

    getPosition(): Coordinate {
        return this.position_
    }

    setPosition(coordinate: Coordinate) {
        this.position_ = this.position_
    }

    getTopOfPoleHeight() {
        console.log(this.position_, this.height_)
        return this.position_.z + this.height_
    }

    optimizeWithGSD(camera: Camera, field: Field, gsd: number) {
        var furthestDistance = 0

        // Calculate furthest and closest OG distance (see diagram)
        field.getPoints().forEach(corner => {
            const distance = camera.getPosition().xyDistance(corner)
            if (distance > furthestDistance) {
                furthestDistance = distance
            }
        })
    }

    /**
     * Optimize a camera's position on the pole to get the best viewing angle of the field
     */
    optimize(camera: Camera, field: Field) {
        
    }
    /**
     * Pitches the camera to the far end of the field, 
     * @param camera The camera to be optimizied
     * @param field The field to search on
     */

    pitchAndSearchOptimization(camera: Camera, field: Field) {
        var maxArea = Number.NEGATIVE_INFINITY
        var maxPitch = 0
        var maxYaw = 0
        const cameraCopy = new Camera(camera.getCameraProperties())

        // Define up vector and prepare
        const upVector2: vec2 = [0,1]
        const localizedFieldVec2s: vec2[] = []
        const origin: vec2 = [0,0]

        // Localize field points to the pole's position by subtracting the pole vector from the field vectors
        field.getPoints().forEach(point => {
            const localizedVec2 = vec2.create()
            vec2.subtract(localizedVec2, point.vec2(), this.position_.vec2())
            localizedFieldVec2s.push(localizedVec2)
        })

        localizedFieldVec2s.sort((a, b) => {
            var angleA = vec2.angle(upVector2, a)
            var angleB = vec2.angle(upVector2, b)

            // If points are left of the origin, make the angle negative (helps to sort)
            angleA = a[0] < upVector2[0] ? angleA : -angleA
            angleB = b[0] < upVector2[0] ? angleB : -angleB
            return angleA - angleB
        })  

        // Set left and right bounds
        const leftBound = localizedFieldVec2s[0]
        const rightBound = localizedFieldVec2s[localizedFieldVec2s.length - 1]
        const angleBetweenBounds = vec2.angle(leftBound, rightBound)
        const angleBetweenLeftAndUp = vec2.angle(upVector2, leftBound)

        // Sort localized vectors by distance from origin
        localizedFieldVec2s.sort((a, b) => {
            const distanceA = vec2.distance(origin, a)
            const distanceB = vec2.distance(origin, b)
            return distanceA - distanceB
        })

        const farthestFieldPoint = localizedFieldVec2s[localizedFieldVec2s.length - 1]
        const farthestFieldPointDistance = vec2.distance(origin, farthestFieldPoint)
        const z = this.getTopOfPoleHeight()
        
        const pitchForYaw = (yaw: number) => {
            const cameraVector: vec2 = vec2.create()
            vec2.rotate(cameraVector, upVector2, origin, yaw)
            const farthestPointCameraAngle = vec2.angle(cameraVector, farthestFieldPoint)
            const farthestPointOnCameraVecDistance = farthestFieldPointDistance * Math.cos(farthestPointCameraAngle)
            const cameraPitch = Math.atan(farthestPointOnCameraVecDistance/z) - (camera.getVerticalFOV()/2.0)
            return cameraPitch
        }

        const cameraProjectionVisibleArea = (yaw: number) => {
            cameraCopy.setCameraProperties({...cameraCopy.getCameraProperties(), yaw: yaw, pitch: pitchForYaw(yaw)})
            return field.areaVisibleWithinProjection(cameraCopy.project())
        }

        var accuracy = 0.001
        // Set initial search area conditions
        const fieldArea = field.getArea()
        var searchMinYaw = angleBetweenLeftAndUp
        var searchMaxYaw = angleBetweenLeftAndUp + angleBetweenBounds
        var searchMinYawArea = cameraProjectionVisibleArea(searchMinYaw)
        var searchMaxYawArea = cameraProjectionVisibleArea(searchMaxYaw)
        
        var searchArea = 0
        while (searchArea - maxArea > accuracy) {
            const yawRange = searchMaxYaw - searchMinYaw
            const searchYaw = searchMinYaw + (yawRange / 2)
            searchArea = cameraProjectionVisibleArea(searchYaw)        }

        camera.setCameraProperties({...camera.getCameraProperties(), pitch: maxPitch, yaw: maxYaw})
    }
    
    /**
     * Point at the angle bisector of the field
     * Camera has to be outside the field
     * @param camera 
     * @param field 
     */
    angleBisectorOptimization(camera: Camera, field: Field) {
        if (pointWithinPolygon(this.position_, field.getPoints())) return

        // Define which way is up and prepare variables
        const upVector2: vec2 = [0,1]
        const localizedFieldVec2s: vec2[] = []
        const origin: vec2 = [0,0]

        // Localize field points to the pole's position by subtracting the pole vector from the field vectors
        field.getPoints().forEach(point => {
            const localizedVec2 = vec2.create()
            vec2.subtract(localizedVec2, point.vec2(), this.position_.vec2())
            localizedFieldVec2s.push(localizedVec2)
        })

        // --- Calculate Ideal Yaw ---
        //
        // Sort localized vectors by angle from origin (-pi/2 radians to pi/2 radians)
        // All angles are calculated from an up vector
        // Angles to the left of the vector are considered positive
        // Angles to the right of the vector are considered negative

        localizedFieldVec2s.sort((a, b) => {
            var angleA = vec2.angle(upVector2, a)
            var angleB = vec2.angle(upVector2, b)

            // If points are left of the origin, make the angle negative (helps to sort)
            angleA = a[0] < upVector2[0] ? angleA : -angleA
            angleB = b[0] < upVector2[0] ? angleB : -angleB
            return angleA - angleB
        })  

        // Set left and right bounds
        const leftBound = localizedFieldVec2s[0]
        const rightBound = localizedFieldVec2s[localizedFieldVec2s.length - 1]
        
        // Angle between left bound and right bound
        const leftRightAngle = vec2.angle(leftBound, rightBound)                
        const bisector = leftRightAngle / 2
        var leftAngle = vec2.angle(upVector2, leftBound)
        leftAngle = leftBound[0] < upVector2[0] ? leftAngle : -leftAngle
        const cameraYaw = leftAngle + bisector
        const cameraVector: vec2 = vec2.create()
        vec2.rotate(cameraVector, upVector2, origin, cameraYaw)

        // Calculate Ideal Z

        // Sort localized vectors by distance from origin
        localizedFieldVec2s.sort((a, b) => {
            const distanceA = vec2.distance(origin, a)
            const distanceB = vec2.distance(origin, b)
            return distanceA - distanceB
        })

        const farthestFieldPoint = localizedFieldVec2s[localizedFieldVec2s.length - 1]
        const farthestFieldPointDistance = vec2.distance(origin, farthestFieldPoint)
        const closestFieldPoint = localizedFieldVec2s[0]
        const closestFieldPointDistance = vec2.distance(origin, closestFieldPoint)
        
        // cos(theta) = adjacent/hypotenuse
        // adjacent = hypotenuse * cos(theta)
        const farthestPointCameraAngle = vec2.angle(cameraVector, farthestFieldPoint)
        const closestPointCameraAngle = vec2.angle(cameraVector, closestFieldPoint)
        const farthestPointOnCameraVecDistance = farthestFieldPointDistance * Math.cos(farthestPointCameraAngle)
        const closestPointOnCameraVecDistance = closestFieldPointDistance * Math.cos(closestPointCameraAngle)
        const fieldVisibilityDistance = farthestPointOnCameraVecDistance - closestPointOnCameraVecDistance


        const vFOV = camera.getVerticalFOV()/2.0
        const sec = (val: number) => (1/Math.cos(val))
        const csc = (val: number) => (1/Math.sin(val))
        const cot = (val: number) => (1/Math.tan(val))
        const sin2 = (val: number) => (Math.pow(Math.sin(val), 2))
        const cos2 = (val: number) => (Math.pow(Math.cos(val), 2))

        const heightOfProjectionWithZ = (distance: number, z: number) => (distance - (z*Math.tan(Math.atan(distance/z)-2*vFOV)))
        const zWithMinLength = (distance: number) => ([
            (-distance * Math.sin(vFOV) - distance * Math.cos(vFOV)) / (Math.cos(vFOV) - Math.sin(vFOV)),
            (distance * Math.cos(vFOV) - distance * Math.sin(vFOV)) / (Math.sin(vFOV) + Math.cos(vFOV))
        ])

        // Bear with me
        const zWithLengthRoot = (length: number, endDistance: number) => Math.sqrt(
            8 * endDistance * (2*length - 2*endDistance) * 
            sin2(vFOV) * cos2(vFOV) +
            (Math.pow(length, 2) * Math.pow(sin2(vFOV) - cos2(vFOV), 2)))
        const zWithLength = (length: number, endDistance: number) => ([
            (1/4) * ((-csc(vFOV) * sec(vFOV)) * zWithLengthRoot(length, endDistance) - length * Math.tan(vFOV) + length * cot(vFOV)),
            (1/4) * ((csc(vFOV) * sec(vFOV)) * zWithLengthRoot(length, endDistance) - length * Math.tan(vFOV) + length * cot(vFOV))
        ])
        const minLengthZ = zWithMinLength(farthestPointOnCameraVecDistance)[1]
        const minLength = heightOfProjectionWithZ(farthestPointOnCameraVecDistance, minLengthZ)
        console.log(farthestPointOnCameraVecDistance, closestPointOnCameraVecDistance, fieldVisibilityDistance)
        console.log(zWithLengthRoot(fieldVisibilityDistance, farthestFieldPointDistance))
        console.log(zWithLength(fieldVisibilityDistance, farthestFieldPointDistance))
        
        const z = Math.min(fieldVisibilityDistance <= minLength ? minLength : zWithLength(fieldVisibilityDistance, farthestPointOnCameraVecDistance)[1], this.getTopOfPoleHeight())

        // Calculate Ideal Pitch
        const cameraPitch = Math.atan(farthestPointOnCameraVecDistance/z) - (camera.getVerticalFOV()/2.0)
        
        // Adjust camera properties based on calculated ideal variables
        camera.setCameraProperties({
            ...camera.getCameraProperties(),
            position: Coordinate.XYZ(this.position_.x, this.position_.y, z),
            yaw: cameraYaw, 
            pitch: cameraPitch
        })

        console.log(leftAngle, leftRightAngle, farthestFieldPoint, farthestFieldPointDistance, cameraVector, farthestPointCameraAngle, farthestFieldPointDistance, cameraPitch)
        
    }

    /**
     * Points a camera to the far corner of a field 
     * @param camera Camera to optimize
     * @param field 
     */

    farCornerOptimization(camera: Camera, field: Field) {
        // Determine farthest corner
        var farthestCorner: Coordinate
        var farthestDistance = 0
        field.getPoints().forEach(point => {
            const distance = this.position_.xyDistance(point)
            if (distance > farthestDistance) {
                farthestCorner = point
                farthestDistance = distance
            }
        })

        // Calculate yaw
        const upVector2: vec2 = [0,1]
        const fieldPointVector2 = vec2.create()
        vec2.subtract(fieldPointVector2, farthestCorner.vec2(), this.position_.vec2())
        var yaw = vec2.angle(upVector2, fieldPointVector2)
        yaw = fieldPointVector2[0] > upVector2[0] ? -yaw : yaw
        
        // Calculate pitch
        const pitch = Math.atan(farthestDistance/this.getTopOfPoleHeight()) - (camera.getVerticalFOV()/2.0)

        camera.setCameraProperties({...camera.getCameraProperties(), yaw: yaw, pitch: pitch})
    }


    /**
     * Inefficient but working method to optimize a camera's viewing angle of the field.
     * This algorithm tries various pitch increments to get the highest (visible field area)^2/(fieldArea * projectionArea)
     * possible, meaning that the most field is visible with the least amount of non-field area.
     * Tends to put camera's very low to the ground, which can introduce large distortion towards the far end of the projection
     * 
     * It's also inefficient itself
     * Like really really slow
     * Like don't use this
     * You get me?
     * 
     * @param camera Camera to optimize
     * @param field Field to optimize the camera's viewing angle for
     */
    exhaustiveOptimize(camera: Camera, field: Field) {
        const PITCH_INCREMENT = (Math.PI/180)
        const YAW_INCREMENT = (Math.PI/180)

        // Define up vector and prepare
        const upVector2: vec2 = [0,1]
        const localizedFieldVec2s: vec2[] = []
        const origin: vec2 = [0,0]

        // Localize field points to the pole's position by subtracting the pole vector from the field vectors
        field.getPoints().forEach(point => {
            const localizedVec2 = vec2.create()
            vec2.subtract(localizedVec2, point.vec2(), this.position_.vec2())
            localizedFieldVec2s.push(localizedVec2)
        })

        localizedFieldVec2s.sort((a, b) => {
            var angleA = vec2.angle(upVector2, a)
            var angleB = vec2.angle(upVector2, b)

            // If points are left of the origin, make the angle negative (helps to sort)
            angleA = a[0] < upVector2[0] ? angleA : -angleA
            angleB = b[0] < upVector2[0] ? angleB : -angleB
            return angleA - angleB
        })  

        // Set left and right bounds
        const leftBound = localizedFieldVec2s[0]
        const rightBound = localizedFieldVec2s[localizedFieldVec2s.length - 1]
        const angleBetweenBounds = vec2.angle(leftBound, rightBound)
        const angleBetweenLeftAndUp = vec2.angle(upVector2, leftBound)

        const cameraCopy = new Camera(camera.getCameraProperties())
        var maximumPitch = 0
        var maximumYaw = 0
        var maximumAreaAchieved = 0
        for (var yaw = 0; yaw<Math.PI * 2; yaw += YAW_INCREMENT) {
            for(var pitch = 0; pitch<cameraCopy.maximumPitchAngle(); pitch += PITCH_INCREMENT) {
                cameraCopy.setCameraProperties({...cameraCopy.getCameraProperties(), pitch: pitch, yaw: yaw})
                const cameraProjection = cameraCopy.project()
                const fieldAreaInProjection = field.areaVisibleWithinProjection(cameraProjection)


                if (fieldAreaInProjection > maximumAreaAchieved) {
                    maximumYaw = yaw
                    maximumPitch = pitch
                    maximumAreaAchieved = fieldAreaInProjection
                }
            }
        }
        
        camera.setCameraProperties({
            ...camera.getCameraProperties(), 
            pitch: maximumPitch, 
            yaw: maximumYaw, 
        })

        console.log(maximumPitch, maximumYaw, maximumAreaAchieved)
    }
}