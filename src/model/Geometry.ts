import Coordinate from "./Coordinate"
import { vec3 } from "gl-matrix"

export function orientate(c1: Coordinate, c2: Coordinate, c3: Coordinate) {
    const val = (c2.y - c1.y) * (c3.x - c2.x) - (c2.x - c1.x) * (c3.y - c2.y)
    if (val == 0) {
        return "COLINEAR" // Points are colinear
    } else if (val > 0) {
        return "CLOCKWISE" // Points are clockwise
    } else {
        return "COUNTERCLOCKWISE" // Points are counterclockwise
    }

}

// Determines if "check" within the segment c1c2
export function onSegment(c1: Coordinate, check: Coordinate, c2: Coordinate) {
    return check.x <= Math.max(c1.x, c2.x) &&
        check.x >= Math.min(c1.x, c2.x) &&
        check.y <= Math.max(c1.y, c2.y) &&
        check.y >= Math.min(c1.y, c2.y)
}

export const linesIntersect = (a1: Coordinate, a2: Coordinate, b1: Coordinate, b2: Coordinate) => {
    const orientation1 = orientate(a1, a2, b1)
    const orientation2 = orientate(a1, a2, b2)
    const orientation3 = orientate(b1, b2, a1)
    const orientation4 = orientate(b1, b2, a2)

    // General Case
    if (orientation1 != orientation2 && orientation3 != orientation4) {
        return true
    }

    // Special Cases for when a point is colinear with a segment and lies on it
    const specialCase1 = orientation1 == "COLINEAR" && onSegment(a1, b1, a2)
    const specialCase2 = orientation2 == "COLINEAR" && onSegment(a1, b2, a2)
    const specialCase3 = orientation3 == "COLINEAR" && onSegment(b1, a1, b2)
    const specialCase4 = orientation4 == "COLINEAR" && onSegment(b1, a2, b2)

    return specialCase1 || specialCase2 || specialCase3 || specialCase4
}

export function intersection(a1: Coordinate, a2: Coordinate, b1: Coordinate, b2: Coordinate): Coordinate | null {
    if (!linesIntersect(a1,a2,b1,b2)) return null
    const a1vec: vec3 = [a1.x, a1.y, 1]
    const a2vec: vec3 = [a2.x, a2.y, 1]
    
    const aLineVec:vec3 = vec3.create()
    vec3.cross(aLineVec, a1vec, a2vec)

    const b1vec: vec3 = [b1.x, b1.y, 1]
    const b2vec: vec3 = [b2.x, b2.y, 1]
    
    const bLineVec:vec3 = vec3.create()
    vec3.cross(bLineVec, b1vec, b2vec)

    const intersection:vec3 = vec3.create()
    vec3.cross(intersection, aLineVec, bLineVec)
    
    // Lines are parallel
    if (intersection[2] == 0) return null
    
    return Coordinate.XY(intersection[0]/intersection[2], intersection[1]/intersection[2])
    
}

/**
 * Determine if a point is within a polygon 
 * @see https://www.geeksforgeeks.org/how-to-check-if-a-given-point-lies-inside-a-polygon/
 */
export function pointWithinPolygon(point: Coordinate, polygon: Coordinate[]): boolean {
    const EXTREME_DISTANCE = 1000000
    const extremePoint = Coordinate.XY(EXTREME_DISTANCE, point.y)
    var intersections = 0
    for (var index = 0; index < polygon.length; index ++) {
        const currentPoint = polygon[index]
        const nextPoint = polygon[(index+1) % polygon.length]
        if (linesIntersect(currentPoint, nextPoint, point, extremePoint)) {
            // Check if coord is colinear with currentPoint and nextPoint, because
            // if it is, then it is within the field if it also lies on the line segment
            // between currentPoint and nextPoint

            if (orientate(currentPoint, point, nextPoint) == "COLINEAR" && onSegment(currentPoint, point, nextPoint)) {
                return onSegment(currentPoint, point, nextPoint)
            }

            intersections++
        }
    }

    const withinPolygon = intersections % 2 == 1
    return withinPolygon
}


/**
 * Convex hull alogrithm retrieved from online
 * @see https://www.nayuki.io/res/convex-hull-algorithm/convex-hull.js
 * @param coordiante Coordinates to create hull from
 * @returns Convex hull coordinates
 */

export function convexHull(originalCoords: Coordinate[]) {
	
	// Returns a new array of points representing the convex hull of
	// the given set of points. The convex hull excludes collinear points.
	// This algorithm runs in O(n log n) time.
	
	// Returns the convex hull, assuming that each points[i] <= points[i + 1]. Runs in O(n) time.
	const makeHullPresorted = (coords: Coordinate[]) => {
		if (coords.length <= 1)
			return coords.slice();
		
		// Andrew's monotone chain algorithm. Positive y coordinates correspond to "up"
		// as per the mathematical convention, instead of "down" as per the computer
		// graphics convention. This doesn't affect the correctness of the result.
		
		var upperHull = [];
		for (var i = 0; i < coords.length; i++) {
			var p = coords[i];
			while (upperHull.length >= 2) {
				var q = upperHull[upperHull.length - 1];
				var r = upperHull[upperHull.length - 2];
				if ((q.x - r.x) * (p.y - r.y) >= (q.y - r.y) * (p.x - r.x))
					upperHull.pop();
				else
					break;
			}
			upperHull.push(p);
		}
		upperHull.pop();
		
		var lowerHull = [];
		for (var i = coords.length - 1; i >= 0; i--) {
			var p = coords[i];
			while (lowerHull.length >= 2) {
				var q = lowerHull[lowerHull.length - 1];
				var r = lowerHull[lowerHull.length - 2];
				if ((q.x - r.x) * (p.y - r.y) >= (q.y - r.y) * (p.x - r.x))
					lowerHull.pop();
				else
					break;
			}
			lowerHull.push(p);
		}
		lowerHull.pop();
		
		if (upperHull.length == 1 && lowerHull.length == 1 && upperHull[0].x == lowerHull[0].x && upperHull[0].y == lowerHull[0].y)
			return upperHull;
		else
			return upperHull.concat(lowerHull);
	};
	
	
	const POINT_COMPARATOR = (a: Coordinate, b: Coordinate) => {
		if (a.x < b.x)
			return -1;
		else if (a.x > b.x)
			return +1;
		else if (a.y < b.y)
			return -1;
		else if (a.y > b.y)
			return +1;
		else
			return 0;
	};
	
    var newPoints = originalCoords.slice();
    newPoints.sort(POINT_COMPARATOR);
    return makeHullPresorted(newPoints);
	
}

/**
* Calculates area from n>3 coordinates
* @param coordinates Points of polygon
* @returns {number} area in m^2
*/

export function calculateArea(coordinates: Coordinate[]): number {
   if (coordinates.length < 3) {
       return
   }

   var area = 0
   for (var index = 0; index<coordinates.length; index++) {
       const currentPoint = coordinates[index]
       const nextPoint = coordinates[(index+1) % coordinates.length]
       area += ((currentPoint.x*nextPoint.y)-(currentPoint.y*nextPoint.x))
   }
   
   return Math.abs(area/2)
}