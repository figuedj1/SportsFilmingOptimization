import Color from "../components/renderer/Color";
import Camera, { CameraProperties, DefaultCameraProperties } from "./Camera";
import Coordinate from "./Coordinate";
import Environment, { EnvironmentSetup } from "./Environment";
import Field from "./Field";
import { Pole } from "./Pole";

export interface Identifiable {
    readonly id: string
}

// Listener Types
type PoleListener = (pole: Pole) => void
type CameraListener = (camera: Camera) => void
type FieldListener = (dimensions: Coordinate[], field?: Field) => void

function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
}

export class EventEnvironment extends Environment {
    
    // Events
    public cameraNonRenderPropsModified: CameraListener[] = []
    public cameraRenderPropsModified: CameraListener[] = []
    public fieldDimensionsModified: FieldListener[] = []
    private polePropertiesModified: PoleListener[] = []

    constructor(setup: EnvironmentSetup) {
        super(setup)
        this.registerFieldEvents(this.getField())
        setup.cameras.forEach((cam) => {
            this.reigsterCameraEvents(cam)
        })


    }
    
    // Listeners
    addPoleListener(callback: PoleListener) {
        this.polePropertiesModified.push(callback)
    }

    removePoleListener(callback: PoleListener) {
        const removeIndex = this.polePropertiesModified.findIndex(func => (func === callback))
        this.polePropertiesModified.splice(removeIndex, 1)
    }

    private callPollListeners(pole: EventPole) {
        this.polePropertiesModified.forEach(func => func(pole))
    }



    getField(): EventField {
        return super.getField() as EventField
    }

    getCameras(): EventCamera[] {
        return super.getCameras() as EventCamera[]
    }

    getPoles(): EventPole[] {
        const ePoles = super.getPoles().map((pole) => {
            if (pole instanceof EventPole) {
                return pole as EventPole
            }
        })
        return ePoles
    }

    addCamera(camera: Camera) {
        super.addCamera(camera)
        this.cameraRenderPropsModified.forEach(func => func(camera))
        this.cameraNonRenderPropsModified.forEach(func => func(camera))
        this.reigsterCameraEvents(camera)
    }


    addPole(pole: Pole) {
        super.addPole(pole)
        this.callPollListeners(pole as EventPole)
        this.registerPoleEvents(pole as EventPole)
    }

    removeCamera(camera: EventCamera) {
        let removeIndex = this.getCameras().findIndex(cam => (cam as EventCamera).id === camera.id)
        this.getCameras().splice(removeIndex, 1)
        this.cameraRenderPropsModified.forEach(func => func(camera))
        this.cameraNonRenderPropsModified.forEach(func => func(camera))
    }

    private reigsterCameraEvents(camera: Camera) {
        if (camera instanceof EventCamera) {
            let ecam = camera as EventCamera
            ecam.cameraPropsChanged.push(() => {
                // When the camera's properties are changed, fire a function
                // that lets all environment listeners know that the properties
                // have been updated. Note that these properties won't affect
                // any calculations or rendering, i.e. the camera's name
                this.cameraNonRenderPropsModified.forEach(func => func(ecam))
            })
            ecam.cameraRenderPropsChanged.push(() => {
                // When this camera's render properties are changed, fire a function
                // that lets all environment listeners know that the render propeprties
                // have been updated. 
                this.cameraRenderPropsModified.forEach(func => func(ecam))
            })
        }
    }

    private registerFieldEvents(field: Field) {
        if (field instanceof EventField) {
            let eField = field as EventField
            eField.fieldDimensionsChanged.push((coords, newField) => {
                // When the field dimensions are changed, fire a function
                // that lets all environment listeners know that the dimensions
                // have been updated. 
                this.fieldDimensionsModified.forEach(func => func(coords, newField))
            })
        }
    }

    private registerPoleEvents(pole: EventPole) {
        pole.addListener((pole: Pole) => {
            this.callPollListeners(pole as EventPole)
        })
    }

    setField(field: EventField) {
        super.setField(field)
        this.registerFieldEvents(this.getField())
    }

    loadFromJSON(json: string) {
        const jsonObject = JSON.parse(json)
        this.getCameras().splice(0, this.getCameras().length)
        this.setField(new EventField(
            Coordinate.XYZ(jsonObject.field.c1.x, jsonObject.field.c1.y, jsonObject.field.c1.z),
            Coordinate.XYZ(jsonObject.field.c2.x, jsonObject.field.c2.y, jsonObject.field.c2.z)
        ))
        

        this.fieldDimensionsModified.forEach(func => func(this.getField().getBoundPoints(), this.getField()))
        
        let jsonCameras = jsonObject.cameras as any[]
        jsonCameras.forEach(camera => {
            let jProps = camera.props as any
            let camProps: SimulatorCameraProperties = {
                poleHeight: jProps.poleHeight ?? DefaultSimulatorCameraProperties.poleHeight,
                sensorHeight: jProps.sensorHeight ?? DefaultSimulatorCameraProperties.sensorHeight,
                sensorWidth: jProps.sensorWidth ?? DefaultSimulatorCameraProperties.sensorWidth,
                sensorXResolution: jProps.sensorXResolution ?? DefaultSimulatorCameraProperties.sensorXResolution,
                sensorYResolution: jProps.sensorYResolution ?? DefaultSimulatorCameraProperties.sensorYResolution,
                focalDistance: jProps.focalDistance ?? DefaultSimulatorCameraProperties.focalDistance,
                pitch: jProps.pitch ?? DefaultSimulatorCameraProperties.pitch,
                yaw: jProps.yaw ?? DefaultSimulatorCameraProperties.yaw,
                position: Coordinate.XYZ(jProps.position.x as number, jProps.position.y as number, jProps.position.z as number) ?? DefaultSimulatorCameraProperties.position,
                price: jProps.price ?? DefaultSimulatorCameraProperties.price,
                frameRate: jProps.frameRate ?? DefaultSimulatorCameraProperties.frameRate,
                name: jProps.name ?? DefaultSimulatorCameraProperties.name,
                color: jProps.color ?? DefaultSimulatorCameraProperties.color,
                targetGSD: jProps.targetGSD ?? DefaultCameraProperties.targetGSD,
                visible: true,
            }
            let eCam = new EventCamera(camProps)
            this.addCamera(eCam)
        })
    }

    getJSONString(): string {
        const fieldBoundPoints = this.getField().getBoundPoints()
        var jsonObject = {
            field: {
                c1: fieldBoundPoints[0],
                c2: fieldBoundPoints[1]
            },

            cameras: this.getCameras().map((cam) => {
                return {props: cam.getCameraProperties()}
            })
        }

        return JSON.stringify(jsonObject)
    }


}

export interface SimulatorCameraProperties extends CameraProperties {
    color?: string,
    name?: string,
    visible: boolean,
}

export const DefaultSimulatorCameraProperties: SimulatorCameraProperties = {
    ...DefaultCameraProperties,
    color: "#ffff00",
    visible: true
}

export class EventCamera extends Camera implements Identifiable {
    public cameraPropsChanged: ((camera: Camera) => void)[] = []
    public cameraRenderPropsChanged: ((props: CameraProperties, camera?: Camera) => void)[] = []
    public readonly id = generateId()
    private _simulatorCameraProperties: SimulatorCameraProperties

    constructor(properties: SimulatorCameraProperties) {
        super(properties)
        this._simulatorCameraProperties = properties
    }

    private callRenderPropsChangedListeners(props: CameraProperties) {
        if (this.cameraRenderPropsChanged != undefined) {
            this.cameraRenderPropsChanged.forEach(func => func(props, this))
        }
    }

    private callPropsChangedListeners() {
        if (this.cameraPropsChanged != undefined) {
            this.cameraPropsChanged.forEach(func => func(this))
        }
    }

    getCameraProperties(): SimulatorCameraProperties {
        return this._simulatorCameraProperties
    }

    setName(newName: string) {
        this.setCameraProperties({...this.getCameraProperties(), name: newName})
    }

    setVisible(visible: boolean) {
        this.setCameraProperties({...this.getCameraProperties(), visible: visible})
    }

    setCameraProperties(properties: SimulatorCameraProperties): SimulatorCameraProperties {
        const prevProps = this.getCameraProperties()
        const props = super.setCameraProperties(properties)
        this._simulatorCameraProperties = {...properties, ...props}
        // These properties (price and framerate) do not affect the actual projection
        // of the camera, therefore, this function will not send a render props changed event if
        // these are the only props modified
        
        var callRender = false
        var callPropsChange = false
        if (prevProps != null) {
            const nonRenderTypes:Set<keyof CameraProperties> = new Set()
            nonRenderTypes.add("price")
            nonRenderTypes.add("frameRate")
            nonRenderTypes.add("sensorXResolution")
            nonRenderTypes.add("sensorYResolution")

            // Test if any modified properties are going to affect the render, and if so, set callRender to true
            // which will fire the camera render props changed listeners
            const propKeys = Object.keys(props) as (keyof CameraProperties)[]
            for (var index=0; index<propKeys.length; index++) {
                let key = propKeys[index]
                let oldProp = prevProps[key]
                let newProp = props[key]
                if (oldProp != newProp) {
                    if (!nonRenderTypes.has(key)) {
                        callRender = true
                    } else {
                        callPropsChange = true
                    }

                    if (callRender && callPropsChange) {
                        break
                    }
                }
            }   
        } else {
            callRender = true
        }

        if (callRender) this.callRenderPropsChangedListeners(props)
        if (callPropsChange) this.callPropsChangedListeners()

        return this._simulatorCameraProperties
    }

    

}

export class EventField extends Field implements Identifiable {
    readonly id: string = generateId()
    public visible: boolean = true

    constructor(c1: Coordinate, c2: Coordinate) {
        super(c1, c2)
    }

    public fieldDimensionsChanged: ((newDimensions: Coordinate[], field?: EventField) => void)[] = []

    private callListeners() {
        if (this.fieldDimensionsChanged != undefined) {
            this.fieldDimensionsChanged.forEach(func => func(this.getPoints(), this))
        }
    }

    setPoints(c1: Coordinate, c2: Coordinate) {
        super.setPoints(c1, c2)
        this.callListeners()
    }

    setVisible(visible: boolean) {
        this.visible = visible
        this.callListeners()
    }


}

export class EventPole extends Pole implements Identifiable {
    readonly id: string = generateId();
    name?: string;
    public visible: boolean = true;
    private propertiesChanged:PoleListener[] = []
    

    setVisible(visible: boolean) {
        this.visible = visible
    }

    addListener(callback: PoleListener) {
        this.propertiesChanged.push(callback)
    }

    removeListener(callback: PoleListener) {
        const removeIndex = this.propertiesChanged.findIndex(e => e === callback)
        this.propertiesChanged.splice(removeIndex, 1)
    }

    callPoleListeners() {
        this.propertiesChanged.forEach(func => func(this))
    }
}