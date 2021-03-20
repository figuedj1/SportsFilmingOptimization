export function roundToPlaces(num: number, places: number) {
    return Math.round(num * Math.pow(10, places)) / Math.pow(10,places)
}

export function radiansToDegrees(ang: number) {
    return ang * (180/Math.PI)
}

export function degreesToRadians(ang: number) {
    return ang * (Math.PI/180)
}

export function mod(x: number, n: number): number {
    return  (((x % n) + n) % n)
}