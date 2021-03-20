import { Button, Checkbox, Divider, FormControl, FormControlLabel, Paper, TextField, Typography } from '@material-ui/core';
import React, { useCallback, useEffect, useState } from 'react';
import { CompactPicker } from 'react-color';
import Camera, { CameraProperties } from '../../model/Camera';
import Coordinate from '../../model/Coordinate';
import { EventCamera, SimulatorCameraProperties } from '../../model/WrappedEventModel';
import { roundToPlaces } from '../../util/MathFuncs';
import { useEnvironment } from '../Providers';
import { useEditorState } from '../providers/Editor';
import { NumericControl } from './controls/NumericControl';
import { OptimizationMenu } from './controls/OptimizationMenu';

interface CameraViewProps {
    style?: React.CSSProperties
    camera: EventCamera
}

export const CameraView: React.FC<CameraViewProps> = ({style, camera}) => {
        const [cameraName, setCameraName] = useState(camera.getCameraProperties().name)
        const [props, setCamProps] = useState(camera.getCameraProperties())
        const [optimizationMethodOpen, setOptimizationMethodOpen] = useState(false)
        const [fieldAreaVisible, setFieldAreaVisible] = useState(NaN)
        const [trapezoidArea, setTrapezoidArea] = useState(NaN)
        const [fieldArea, setFieldArea] = useState(NaN)

        const environment = useEnvironment()
        const editor = useEditorState()

        const setPosition = useCallback((x: number, y: number, z: number) => {
            const newProps = {...props, position: Coordinate.XYZ(x,y,z)}
            setCamProps(newProps)
            camera.setCameraProperties(newProps)
        }, [props, setCamProps])
        
        const setNumericCameraProperty = useCallback((key: keyof CameraProperties, value: number) => {
            if (key == "position") {
                // Wrong function to handle position
                return
            }

            var newProps: SimulatorCameraProperties = {...props}
            newProps[key] = value as any
            setCamProps(newProps)
            camera.setCameraProperties(newProps)
        }, [props, setCamProps])

        useEffect(() => {
            let nonRenderPropsCallback = (camera: EventCamera) => { 
                setCameraName(camera.getCameraProperties().name ?? "") 
            }
            let renderPropsCallback = (props: SimulatorCameraProperties, camera: Camera) => { 
                setTrapezoidArea(camera.getProjectionArea())
                setFieldAreaVisible(environment.getField().areaVisibleWithinProjection(camera.project()))
                setFieldArea(environment.getField().getArea())
                setCamProps({...props}) 
            }
            camera.cameraRenderPropsChanged.push(renderPropsCallback)
            camera.cameraPropsChanged.push(nonRenderPropsCallback)
            nonRenderPropsCallback(camera)
            renderPropsCallback(camera.getCameraProperties(), camera)
            return () => {
                let letRenderRemoveIndex = camera.cameraRenderPropsChanged.findIndex(element => element === renderPropsCallback)
                let letNonRenderRemoveIndex = camera.cameraPropsChanged.findIndex(element => element === nonRenderPropsCallback)
                camera.cameraRenderPropsChanged.splice(letRenderRemoveIndex, 1)
                camera.cameraPropsChanged.splice(letNonRenderRemoveIndex, 1)
            }
        }, [camera, environment])

        return (
            <div 
                style={{...style, padding: 8, overflowY: "auto", overflowX: "hidden"}}
            >
                <div style={{display: "flex"}}>
                    <TextField
                        style={{
                            flex: 1,
                            marginTop: 16,
                            marginBottom: 16
                        }}
                        label="Name"
                        value={cameraName}
                        onChange={(e) => {
                            camera.setName(e.currentTarget.value)
                            setCameraName(e.currentTarget.value)
                        }}
                    />

                    <FormControlLabel
                        value="start"
                        control={<Checkbox color="primary" checked={props.visible} onChange={(e) => {camera.setVisible(e.target.checked)}} />}
                        label="Visible"
                        labelPlacement="start"
                    />
                </div>

                <CompactPicker 
                        color={camera.getCameraProperties().color!}
                        onChange={(color) => {
                            camera.setCameraProperties({...camera.getCameraProperties(), color: color.hex})
                        }}
                    />
                

                {/* Sensor Controls */}
                <Paper
                    style={{
                        padding: 8,
                        marginTop: 8,
                        marginBottom: 8
                    }}
                >
                    
                    <Typography variant="h5">Sensor</Typography>
                    <Typography variant="overline">Sensor Physical Dimensions</Typography>
                    <div
                        style={{
                            display: "flex",
                        }}
                    >
                        <NumericControl
                            style={{margin: 4}}
                            name="Width"
                            unit="mm"
                            value={props.sensorWidth}
                            onChange={(val) => {setNumericCameraProperty("sensorWidth", val)}}
                        />
                        <NumericControl
                            style={{margin: 4}}
                            name="Height"
                            unit="mm"
                            value={props.sensorHeight}
                            onChange={(val) => {setNumericCameraProperty("sensorHeight", val)}}
                        />
                    </div>

                    <div
                        style={{
                            display: "flex",
                        }}
                    >
                        <NumericControl
                            style={{margin: 4, width: "100%"}}
                            name="Focal Distance"
                            unit="mm"
                            value={props.focalDistance}
                            onChange={(val) => {setNumericCameraProperty("focalDistance", val)}}
                        />
                    </div>

                    <Typography variant="overline">Camera Resolution</Typography>
                    <div
                        style={{
                            display: "flex",
                        }}
                    >
                        <NumericControl
                            style={{margin: 4}}
                            name="Width"
                            unit="px"
                            value={props.sensorXResolution}
                            onChange={(val) => {setNumericCameraProperty("sensorXResolution", val)}}
                        />
                        <NumericControl
                            style={{margin: 4}}
                            name="Height"
                            unit="px"
                            value={props.sensorYResolution}
                            onChange={(val) => {setNumericCameraProperty("sensorYResolution", val)}}
                        />
                    </div>

                    <FormControl fullWidth>
                    <NumericControl
                        style={{margin: 4}}
                        name="Frame Rate"
                        unit="fps"
                        value={props.frameRate}
                        onChange={(val) => {setNumericCameraProperty("frameRate", val)}}
                    />
                    </FormControl>

                    <Divider light style={{marginTop: 8, marginBottom: 8}}/>
                    <FormControl fullWidth>
                        <NumericControl
                                name="Price"
                                unit="$"
                                unitPosition="start"
                                value={props.price}
                                onChange={(val) => {setNumericCameraProperty("price", val)}}
                        />
                    </FormControl>
                    <Divider light style={{marginTop: 8, marginBottom: 8}}/>
                    <Typography variant="overline">Camera Projection</Typography>
                    <Typography>Projection Area: {roundToPlaces(trapezoidArea, 2)} m^2</Typography>
                    <Typography>X Ground Distance: {roundToPlaces(camera.getGroundDistanceX(), 2)} m</Typography>
                    <Typography>Y Ground Distance: {roundToPlaces(camera.getGroundDistanceY(), 2)} m</Typography>
                    <Typography>Avg. X GSD: {roundToPlaces(camera.getAverageGroundSamplingDistanceX(), 5)} m/px</Typography>
                    <Typography>Avg. Y GSD: {roundToPlaces(camera.getAverageGroundSamplingDistanceY(), 5)} m/px</Typography>
                    <FormControl fullWidth>
                        <NumericControl
                                name="Target GSD"
                                unit="m/px"
                                unitPosition="end"
                                value={props.targetGSD}
                                onChange={(val) => {setNumericCameraProperty("targetGSD", val)}}
                        />
                        </FormControl>
                    <Divider light style={{marginTop: 8, marginBottom: 8}}/>
                    <Typography variant="overline">Field Visibility</Typography>
                    <Typography>Visibility: {Math.round(fieldAreaVisible/fieldArea * 10000) / 100}% </Typography>
                    <Typography>Field Area Visible: {Math.round(fieldAreaVisible * 10000)/10000} m^2</Typography>
                </Paper>
                {/* Transform Controls */}
                <Paper
                    style={{
                        padding: 8,
                        marginTop: 8,
                        marginBottom: 8
                    }}
                >
                    <Typography variant="h5">Transform</Typography>
                    <div
                        style={{
                            display: "flex",
                        }}
                    >
                        <FormControl fullWidth>
                        <NumericControl
                                name="Pole Height"
                                unit="m"
                                unitPosition="end"
                                value={props.poleHeight}
                                onChange={(val) => {setNumericCameraProperty("poleHeight", val)}}
                        />
                        </FormControl>
                    </div>
                    <Divider light style={{marginTop: 8, marginBottom: 8}}/>
                    <Typography variant="overline">Position</Typography>
                    <div
                        style={{
                            display: "flex",
                        }}
                    >
                        <NumericControl
                            style={{margin: 4}}
                            color="red"
                            name="X"
                            unit="m"
                            value={props.position.x}
                            onChange={(val) => {setPosition(val, props.position.y, props.position.z)}}
                        />
                        <NumericControl
                            style={{margin: 4}}
                            color="green"
                            name="Y"
                            unit="m"
                            value={props.position.y}
                            onChange={(val) => {setPosition(props.position.x, val, props.position.z)}}
                        />
                        <NumericControl
                            color="blue"
                            style={{margin: 4}}
                            name="Z"
                            unit="m"
                            value={props.position.z}
                            onChange={(val) => {setPosition(props.position.x, props.position.y, val)}}
                        />
                    </div>
                    
                    <Divider light style={{marginTop: 8, marginBottom: 8}}/>

                    <Typography variant="overline">Rotation</Typography>
                    <div
                        style={{
                            display: "flex",
                        }}
                    >
                        <NumericControl
                            style={{margin: 4}}
                            name="Elevation"
                            unit="deg"
                            value={props.pitch * (180/Math.PI)}
                            onChange={(val) => {setNumericCameraProperty("pitch", val * (Math.PI/180))}}
                        />
                        <NumericControl
                            style={{margin: 4}}
                            name="Azimuth"
                            unit="deg"
                            value={props.yaw * (180/Math.PI)}
                            onChange={(val) => {setNumericCameraProperty("yaw", val * (Math.PI/180))}}
                        />
                    </div>
                </Paper>

                <Button 
                        style={{
                            marginTop: 16,
                            width: "100%",
                            color: "white"
                        }}
                        color="primary"
                        variant="contained"
                        onClick={() => {
                            environment.addCamera(new EventCamera(camera.getCameraProperties()))
                        }}
                >Clone
                </Button>

                <Button 
                        style={{
                            marginTop: 16,
                            width: "100%",
                            color: "white"
                        }}
                        color="primary"
                        variant="contained"
                        onClick={() => {
                            setOptimizationMethodOpen(true)
                        }}
                >Optimize
                </Button>
                <OptimizationMenu
                    onClose={() => {setOptimizationMethodOpen(false)}}
                    open={optimizationMethodOpen}
                    camera={camera} 
                    field={environment.getField()} 
                />

                <Button 
                        style={{
                            marginTop: 16,
                            width: "100%",
                            backgroundColor: "red",
                            color: "white"
                        }}
                        variant="contained"
                        onClick={() => {
                            environment.removeCamera(camera) 
                            editor.setCurrentSelectedObject(null)
                        }}
                >Delete Camera
                </Button>
            </div>
        );
}

