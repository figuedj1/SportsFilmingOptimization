import { vec2 } from "gl-matrix";
import Coordinate from "./Coordinate";
import { Pole } from "./Pole";

/**
 * A camera class. Represents a pin-hole camera with properties such as sensor size and focal distance.
 * Capable of projecting its view as coordinates.
 */

export type CameraProjection = [Coordinate, Coordinate, Coordinate, Coordinate]
export default class Camera {

    private _properties: CameraProperties
    private _computedPropreties: ComputedCameraProperties

    constructor(properties: CameraProperties) {
        this.setCameraProperties(properties)
    }

    getPitch(): number {
        return this._properties.pitch
    }

    getPosition(): Coordinate {
        return this._properties.position
    }

    /**
     * Returns the class' private properties.
     * @returns {CameraProperties} The camera's properties
     */
    getCameraProperties() {
        return this._properties
    }

    /**
     * Set's the camera's properties with new provided properties. This will also recompute
     * the camera's FOV angles.
     * @param properties The new properties to apply
     * @returns The newly applied properties
     */
    setCameraProperties(properties: CameraProperties): CameraProperties {
        this._properties = properties
        this.calculateFOV()
        return this._properties
    }

    maximumPitchAngle(): number {
        return ((Math.PI/2) - this._computedPropreties.verticalFOV/2.0) 
    }

    mountToPoleTop(pole: Pole) {
        const polePos = pole.getPosition()
        const topOfPoleHeight = pole.getTopOfPoleHeight()
        this.setCameraProperties({
            ...this.getCameraProperties(),
            position: Coordinate.XYZ(polePos.x, polePos.y, topOfPoleHeight)
        })
    }

    pointAt(point: Coordinate) {
        const upVector2: vec2 = [0,1]
        var vecRelCamera = vec2.create()
        vec2.subtract(vecRelCamera, point.vec2(), this.getPosition().vec2())
        const angle = vec2.angle(upVector2, vecRelCamera)
        const yaw = vecRelCamera[0] > upVector2[0] ? -angle: angle
        this.setCameraProperties({...this.getCameraProperties(), yaw: yaw})
    }

    calculateFOV() {
        const horizontalFOV = this.calculateFOVAngle(this._properties.sensorWidth)
        const verticalFOV = this.calculateFOVAngle(this._properties.sensorHeight)
        this._computedPropreties = {horizontalFOV: horizontalFOV, verticalFOV: verticalFOV}
    }

    /**
     * Calculates the either the horizontal or vertical field of view angle of the camera
     * @param length Either the width/height of the sensor in mm
     */
    calculateFOVAngle(length: number): number {
        return 2*Math.atan((length)/(2*this._properties.focalDistance));
    }

    /**
     * Returns various distances of the projected trapezoid.
     * @returns nearHeight, farHeight, nearWidth, farWidth
     */

    getDistances(): [number, number, number, number] {
        const nearHeight = this._properties.position.z * Math.tan(this._properties.pitch - this._computedPropreties.verticalFOV/2.0)
        const farHeight = this._properties.position.z * Math.tan(this._properties.pitch + this._computedPropreties.verticalFOV/2.0)
        const nearWidth = (this._properties.position.z * this._properties.sensorWidth * Math.cos(this._computedPropreties.verticalFOV/2.0)) / (2*this._properties.focalDistance*Math.cos(this._properties.pitch-this._computedPropreties.verticalFOV/2.0))
        const farWidth = (this._properties.position.z * this._properties.sensorWidth * Math.cos(this._computedPropreties.verticalFOV/2.0)) / (2*this._properties.focalDistance*Math.cos(this._properties.pitch+this._computedPropreties.verticalFOV/2.0))
        return [nearHeight, farHeight, nearWidth, farWidth]
    }

    /**
     * Project a camera's field of view. Result is a trapezoid, and coordinates are in meters.
     * @returns Coordinates of the camera's projection 
     */
    project(): CameraProjection {
        // The camera's projection is a trapezoid. The follwing functions calculate the side lengths
        const [distance1, distance2, distance3, distance4] = this.getDistances()
        let rotate = (coordinate: Coordinate): Coordinate => {
            let rotatedX = coordinate.x * Math.cos(this._properties.yaw) - coordinate.y * Math.sin(this._properties.yaw)
            let rotatedY = coordinate.y * Math.cos(this._properties.yaw) + coordinate.x * Math.sin(this._properties.yaw)
            return Coordinate.XY(rotatedX, rotatedY)
        }
        
        const c3 = rotate(Coordinate.XY(distance3, distance1)).addXY(this._properties.position)
        const c4 = rotate(Coordinate.XY(-distance3, distance1)).addXY(this._properties.position)
        const c2 = rotate(Coordinate.XY(distance4, distance2)).addXY(this._properties.position)
        const c1 = rotate(Coordinate.XY(-distance4, distance2)).addXY(this._properties.position)

        return [c1,c2,c3,c4]
    }

    /**
     * Get the area of the projection trapezoid.
     * @returns {number} area in m^2
     */
    getProjectionArea(): number {
        const [distance1, distance2, distance3, distance4] = this.getDistances()

        // Calcualte the area of the trapezoid using 1/2(a+b)h
        const a = 2*distance4
        const b = 2*distance3
        const height = distance2-distance1 
        return ((1/2)*(a+b)*height)
    }

    getGroundDistanceX(): number {
        return (2*this._properties.position.z*Math.tan(this._computedPropreties.horizontalFOV!/2.0)) / Math.cos(this._properties.pitch)
    }

    getGroundDistanceY(): number {
        return (this._properties.position.z)*(Math.tan(this._properties.pitch + this._computedPropreties.verticalFOV!/2.0) - Math.tan(this._properties.pitch - this._computedPropreties.verticalFOV!/2.0))
    }

    /**
     * Average Ground Sampling Distance for X
     * Format: m/px
     */
    getAverageGroundSamplingDistanceX(): number {
        return this.getGroundDistanceX() / this._properties.sensorXResolution
    }
    
    /**
     * Average Ground Sampling Distance for Y
     * @returns {number} m/px
     */
    getAverageGroundSamplingDistanceY(): number {
        return this.getGroundDistanceY() / this._properties.sensorYResolution
    }

    getHorizontalFOV(): number {
        return this._computedPropreties.horizontalFOV
    }

    getVerticalFOV(): number {
        return this._computedPropreties.verticalFOV
    }

    getXResolution(): number {
        return this._properties.sensorXResolution
    }

    getYResolution(): number {
        return this._properties.sensorYResolution
    }



}

export interface CameraProperties {
    // Physical dimensions of the camera's sensor in mm
    sensorWidth: number,
    sensorHeight: number,

    // Pixel resolution of the camera's sensor
    sensorXResolution: number,
    sensorYResolution: number,

    // The camera's focal distance, which is the distance of
    // the image plane from the apeture / focal point, in mm
    focalDistance: number,

    // Camera's transform
    // pitch: Rotates the camera up and down
    // yaw: Rotates the camera left and right around its pole
    yaw: number,
    pitch: number,
    position: Coordinate,
    poleHeight: number,

    frameRate?: number,
    price?: number,
    targetGSD?: number,
}


export const DefaultCameraProperties:CameraProperties  = {
    sensorWidth: 2,
    sensorHeight: 1,
    sensorXResolution: 2000,
    sensorYResolution: 1000,
    focalDistance: 1,
    poleHeight: 15,
    yaw: 0,
    pitch: 0,
    position: Coordinate.XYZ(0,0,5),
    frameRate: 30,
    price: 0,
    targetGSD: 0.01
}

export interface ComputedCameraProperties {
    // Camera's FOV angles, these are computed by the Camera's constructor
    // so they are initially left undefined
    horizontalFOV?: number,
    verticalFOV?: number,

}