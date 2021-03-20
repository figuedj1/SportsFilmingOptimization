import Camera from "./Camera";
import Coordinate from "./Coordinate";
import Field from "./Field";
import { Pole } from "./Pole";

export default class Environment {
    
    private cameras: Camera[]
    private field: Field
    private poles: Pole[]

    constructor(setup: EnvironmentSetup) {
        this.cameras = setup.cameras
        this.field = setup.field 
        this.poles = setup.poles
    }

    getCameras(): Camera[] {
        return this.cameras
    }

    getField(): Field {
        return this.field
    }

    setField(field: Field) {
        this.field = field
    }

    getPoles(): Pole[] {
        return this.poles
    }

    addCamera(camera: Camera) {
        this.cameras.push(camera)
    }

    addPole(pole: Pole) {
        this.poles.push(pole)
    }

    /**
     * Using a method detailed in the slides, we optimize the yaw of the cameras
     **/
    optimizeCameraYaws() {
        function lineFromCoordinates(c1: Coordinate, c2: Coordinate): ((x: number) => number) {
            const slope = (c2.y - c1.y) / (c2.x - c1.x) 
            return (x: number) => (slope * (x - c1.x)) + c1.y
        }
        
        const fieldPoints = this.field.getBoundPoints()
        const otherFieldPoints = this.field.getAlternateBoundPoints()
        
        const lineBetweenCorners = lineFromCoordinates(fieldPoints[0], fieldPoints[1])
        const lineBetweenOtherCorners = lineFromCoordinates(otherFieldPoints[0], otherFieldPoints[1])
        var topBottomCameras: Camera[] = []
        var leftRightCameras: Camera[] = []
        
        this.cameras.forEach(camera => {
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
        const fieldWidth = this.field.getWidth()
        const fieldHeight = this.field.getHeight()
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
        
        for (let i = 1; i < verticalSubdivisions+1; i++) {
            const subdivisionPoint = Coordinate.XY(middleFieldX, fieldPoints[0].y + i*verticalSubdivisionLength)
            verticalCoordinates.push (subdivisionPoint)
            const camera = remainingLeftRightCameras[i-1]
            camera.pointAt(subdivisionPoint)
        }
        
        for (let i = 1; i < horizontalSubdivisions+1; i++) {
            const subdivisionPoint = Coordinate.XY(fieldPoints[0].x + i*horizontalSubdivisionLength, middleFieldY)
            horizontalCoordinates.push(subdivisionPoint)
            const camera = remainingTopBottomCameras[i-1]
            camera.pointAt(subdivisionPoint)
        }
    }
}

export interface EnvironmentSetup {
    cameras: Camera[],
    field?: Field,
    poles: Pole[]
}