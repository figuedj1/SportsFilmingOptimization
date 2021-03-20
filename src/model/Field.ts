import Coordinate from "./Coordinate";
import { linesIntersect, orientate, onSegment, intersection, pointWithinPolygon, calculateArea, convexHull } from "./Geometry";
import { CameraProjection } from "./Camera";

export type FieldPoints = [Coordinate, Coordinate, Coordinate, Coordinate]
export default class Field {
    private c1: Coordinate
    private c2: Coordinate
    private c3: Coordinate
    private c4: Coordinate

    constructor(c1: Coordinate, c2: Coordinate) {
        this.setPoints(c1, c2)
    }

    public static fromPosition(center: Coordinate, width: number, height: number): Field {
        const c1 = Coordinate.XY(center.x - width/2, center.y - height/2)
        const c2 = Coordinate.XY(center.x + width/2, center.y + height/2)
        return new Field(c1,c2)

    }

    getWidth(): number {
        return Math.abs(this.c2.x-this.c1.x)
    }

    getHeight(): number {
        return Math.abs(this.c2.y-this.c1.y)
    }

    getArea(): number {
        return this.getWidth() * this.getHeight()
    }

    getCenter(): Coordinate {
        return Coordinate.XY(Math.min(this.c1.x, this.c2.x) + this.getWidth()/2,
        Math.min(this.c1.y,this.c2.y) + this.getHeight()/2)
    }

    /**
     * Find other two points of rectangle given the first two
     * @param c1 First point
     * @param c2 Second point
     */
    calcAndSetRemainingPoints(c1: Coordinate, c2: Coordinate) {
        this.c3 = Coordinate.XY(c1.x, c2.y)
        this.c4 = Coordinate.XY(c2.x, c1.y)
    }

    setPoints(c1: Coordinate, c2: Coordinate) {
        this.c1 = c1
        this.c2 = c2
        this.calcAndSetRemainingPoints(c1, c2)
    }

    setFromPosition(center: Coordinate, width: number, height: number) {
        const c1 = Coordinate.XY(center.x - width/2, center.y - height/2)
        const c2 = Coordinate.XY(center.x + width/2, center.y + height/2)
        this.setPoints(c1, c2)
    }

    getBoundPoints(): [Coordinate, Coordinate] {
        return [this.c1, this.c2]
    }

    getAlternateBoundPoints(): [Coordinate, Coordinate] {
        return [this.c3, this.c4]
    }

    getPoints(): FieldPoints {
        return [this.c1,this.c4,this.c2,this.c3]
    }
    
    getPointsABCD(): FieldPoints {
        return [this.c3,this.c2,this.c4,this.c1]
    }

    /**
     * Returns the lower-left most coordinate
     * @returns Lower-left coordinate
     */

    getLowerLeftCoord(): Coordinate {
        const c1 = this.c1
        const c2 = this.c2
        const c3 = this.c3
        const c4 = this.c4
        return Coordinate.XY(Math.min(c1.x,c2.x,c3.x,c4.x), Math.min(c1.y,c2.y,c3.y,c4.y))
    }

    /**
     * Determine whether the field is fully visible within a camera's projection
     * @param projection Camera projection
     */
    in(projection: CameraProjection): boolean {
        const fieldPoints = this.getPoints()
        var withinField = true
        for (var pointIndex = 0; pointIndex < fieldPoints.length; pointIndex++) {
            const fieldPoint = fieldPoints[pointIndex]
            withinField = pointWithinPolygon(fieldPoint, projection)
            if (!withinField) {
                break
            }
        }

        return withinField
    }

    areaVisibleWithinProjection(projection: CameraProjection): number {
        var fieldPointsWithinProjection: Coordinate[] = []
        const fieldPoints = this.getPoints()

        // Check field points that are within the trapezoid
        fieldPoints.forEach(point => {
            if (pointWithinPolygon(point, projection)) {
                fieldPointsWithinProjection.push(point)
            }
        })

        // Check if the entire field is visible within the projection, beause if so, no further calculations are required
        if (fieldPointsWithinProjection.length == 4) {
            return calculateArea(fieldPointsWithinProjection)
        }
        

        // Find line segments intersecting between the field and the camera's projection trapezoid
        for (var projectionIndex = 0; projectionIndex<projection.length; projectionIndex++) {
            const p1 = projection[projectionIndex]
            const p2 = projection[(projectionIndex+1) % projection.length]

            // First determine if the projection point is within the field, becuase if so, it is one of the points of the intersection polygon
            if (pointWithinPolygon(p1, fieldPoints)) {
                fieldPointsWithinProjection.push(p1)
            }

            // Next, see if the lines that define the edges of the trapezoid / field intersect, because if so, they are one of the points of the intersectrion polygon
            for (var fieldIndex = 0; fieldIndex<fieldPoints.length; fieldIndex++) {
                const f1 = fieldPoints[fieldIndex]
                const f2 = fieldPoints[(fieldIndex+1) % fieldPoints.length]
                const intersect = intersection(p1,p2,f1,f2)
                if (intersect != null) {
                    fieldPointsWithinProjection.push(intersect)
                }

            }
        }

        // Calculate area with the convex hull of the points, which ensures that the points form a proper polygon and don't cross
        return calculateArea(convexHull(fieldPointsWithinProjection))
    }
    
}