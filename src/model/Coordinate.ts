import { vec3, vec2 } from "gl-matrix"

export default class Coordinate {
    
    public x: number
    public y: number
    public z: number
    public static readonly zero: Coordinate = Coordinate.XYZ(0,0,0)
    public static readonly origin: Coordinate = Coordinate.XYZ(0,0,0)
    public static readonly up: Coordinate = Coordinate.XYZ(0,0,1)

    constructor(x: number, y: number, z: number) {
        this.x = x
        this.y = y
        this.z = z
    }

    static toFloat32Array(coordinates: Coordinate[]): Float32Array {
        var coordinateArray: number[] = []
        coordinates.forEach(coord => {
            coordinateArray.push(coord.x,coord.y,coord.z)
        })
        return new Float32Array(coordinateArray)
    }

    copy(): Coordinate {
        return Coordinate.XYZ(this.x,this.y,this.z)
    }

    vec2(): vec2 {
        return [this.x, this.y]
    }

    vec3(): vec3 {
        return [this.x, this.y, this.z]
    }

    static XY(x: number, y: number): Coordinate {
        return new Coordinate(x,y,0)
    }

    static XYZ(x: number, y: number, z: number): Coordinate {
        return new Coordinate(x,y,z)
    }

    addXY(other: Coordinate): Coordinate {
        return Coordinate.XYZ(this.x + other.x, this.y + other.y, this.z)
    }

    addXYZ(other: Coordinate): Coordinate {
        return Coordinate.XYZ(this.x + other.x, this.y + other.y, this.z + other.z)
    }

    scalar(val: number): Coordinate {
        return Coordinate.XYZ(this.x * val, this.y * val, this.z * val)
    }

    /**
     * Measures XY distance using the distance formula.
     * @param other Other coordinate to measure distance from
     */
    xyDistance(other: Coordinate) {
        return Math.sqrt(Math.pow(other.x - this.x, 2) + Math.pow(other.y-this.y, 2))
    }

    /**
     * Measures XYZ distance using the three-dimensional distance formula.
     * @param other Other coordinate to measure distance from
     */
    xyzDistance(other: Coordinate) {
        return Math.sqrt(Math.pow(other.x - this.x, 2) + Math.pow(other.y-this.y, 2) + Math.pow(other.z-this.z,2))
    }


}