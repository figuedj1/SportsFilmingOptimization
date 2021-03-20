import { Button, Paper, Typography } from '@material-ui/core';
import React, { useState, useEffect } from 'react';
import Field from '../../model/Field';
import { EventCamera, EventField } from '../../model/WrappedEventModel';
import { useEnvironment } from '../Providers';
import { NumericControl } from './controls/NumericControl';
import Coordinate from '../../model/Coordinate';
import { Pole } from '../../model/Pole';
import { vec2 } from 'gl-matrix';
import { intersection } from '../../model/Geometry';
import { isVariableDeclaration } from 'typescript';
import { degreesToRadians, radiansToDegrees } from '../../util/MathFuncs';

interface FieldViewProps {
    field: Field,
    style?: React.CSSProperties
}

export const FieldView: React.FC<FieldViewProps> = ({field, style}) => {
        const environment = useEnvironment()
        const [x, setX] = useState(field.getCenter().x)
        const [y, setY] = useState(field.getCenter().y)
        const [width, setWidth] = useState(field.getWidth())
        const [height, setHeight] = useState(field.getHeight())

        useEffect(() => {
            field.setFromPosition(Coordinate.XY(x,y), width, height)
        }, [x,y,width,height])

        useEffect(() => {
            let eField = field as EventField
            let callback = (coords: Coordinate[], field: EventField) => {
                setX(field.getCenter().x)
                setY(field.getCenter().y)
                setWidth(field.getWidth())
                setHeight(field.getHeight())
            }
            eField.fieldDimensionsChanged.push(callback)
            return () => {
                let removeIndex = eField.fieldDimensionsChanged.findIndex(element => element === callback)
                eField.fieldDimensionsChanged.splice(removeIndex, 1)
            }
        }, [field])

        return (<div style={{...style, width: "100%", padding: 8}}>
            <Paper
                style={{
                    marginTop: 8,
                    marginBottom: 8,
                    padding: 8,
                    flex: 1,
                }}
            >
                <Typography variant="h5">Field Dimensions</Typography>
                <div style={{display:"flex"}}>
                        <NumericControl
                            style={{margin: 4}}
                            color="red"
                            name="X"
                            unit="m"
                            value={x}
                            onChange={(val) => {field.setFromPosition(Coordinate.XY(val,y), width, height)}}
                        />
                        <NumericControl
                            style={{margin: 4}}
                            color="green"
                            name="Y"
                            unit="m"
                            value={y}
                            onChange={(val) => {field.setFromPosition(Coordinate.XY(x,val), width, height)}}
                        />
                </div>

                <div style={{display:"flex"}}>
                        <NumericControl
                            style={{margin: 4}}
                            name="Width"
                            unit="m"
                            value={width}
                            onChange={(val) => {field.setFromPosition(Coordinate.XY(x,y), val, height)}}
                        />
                        <NumericControl
                            style={{margin: 4}}
                            name="Height"
                            unit="m"
                            value={height}
                            onChange={(val) => {field.setFromPosition(Coordinate.XY(x,y), width, val)}}
                        />
                </div>
            </Paper>
            <Paper
                style={{
                    marginTop: 8,
                    marginBottom: 8,
                    padding: 8,
                    flex: 1
                }}
            >
                <Typography variant="h5">Camera Visiblity</Typography>
                {
                    environment.getCameras().length > 0 ? environment.getCameras().map( camera => {
                        const fieldArea = environment.getField().getArea()
                        const fieldAreaVisible = environment.getField().areaVisibleWithinProjection(camera.project())
                    return (<Typography>{(camera as EventCamera).getCameraProperties().name ?? "Camera"}: {Math.round(fieldAreaVisible * 10000) / 10000} m^2 ({Math.round(fieldAreaVisible / fieldArea * 10000) / 100}%)</Typography>)
                    }) : <Typography>No Cameras Available</Typography>
                }
            </Paper>

            <Paper
                style={{
                    marginTop: 8,
                    marginBottom: 8,
                    padding: 8,
                    flex: 1
                }}
            >
                <Typography variant="h5">Optimization</Typography>
                {
                    <Button
                        variant="contained"
                        onClick={() => {
                            environment.optimizeCameraYaws()
                            environment.getCameras().forEach(camera => {
                                let GSD = camera.getCameraProperties().targetGSD
                                const POLE_MIN_HEIGHT = 3;

                                let azimuth = camera.getCameraProperties().yaw
                                let pos = camera.getPosition()
                                let poleHeight = camera.getCameraProperties().poleHeight
                                let focal = camera.getCameraProperties().focalDistance
                                let s_width = camera.getCameraProperties().sensorWidth
                                let i_width = camera.getXResolution()
                                let i_height = camera.getYResolution()
                                let vfov = camera.getVerticalFOV()
                                let hfov = camera.getHorizontalFOV()

                                const solutions_inv = (height: number) => {
                                    let g_x = Math.acos((2 * height * Math.tan(hfov / 2))/(GSD*i_width))
                                    let g_y = (1/2)*Math.acos((2*height*Math.sin(vfov))/(GSD*i_height) - Math.cos(vfov))
                                    return Math.min(g_x,g_y)
                                }

                                const solutions = (elevation: number) => {
                                    let g_x = (GSD*i_width*Math.cos(elevation))/(2*Math.tan(hfov/2))
                                    let g_y = (GSD*i_height)/(Math.tan(elevation+vfov/2)-Math.tan(elevation-vfov/2))
                                    return Math.min(g_x, g_y)
                                }

                                let elevationPoleHeight = solutions_inv(poleHeight)
                                let elevationMinPoleHeight = solutions_inv(POLE_MIN_HEIGHT)
                                let elevation_min = Math.min(elevationPoleHeight, elevationMinPoleHeight)
                                let elevation_max = Math.max(elevationPoleHeight, elevationMinPoleHeight)
                                console.log(camera.getCameraProperties().name, radiansToDegrees(elevation_min), radiansToDegrees(elevation_max))

                                if (isNaN(elevation_min) || isNaN(elevation_max)) {
                                    alert(`Error, could not optimize camera ${camera.getCameraProperties().name} with a GSD of ${GSD} m/px because there are no valid solutions!`)
                                    return;
                                }

                                let upVector: vec2 = [0, 10000]
                                let rotatedVector = vec2.create()
                                vec2.rotate(rotatedVector, upVector, [0,0], azimuth)
                                let cameraForward = vec2.create()
                                vec2.add(cameraForward, pos.vec2(), rotatedVector)
                                let forwardCoordinate = Coordinate.XY(cameraForward[0], cameraForward[1])
                                var maxFieldDistance = 0
                                var minFieldDistance = Infinity

                                for (var i=0; i<4; i++) {
                                    let fieldCoordinate = field.getPointsABCD()[i]
                                    let nextFieldCoordinate = field.getPointsABCD()[(i+1)%4]
                                    let intersectionPoint = intersection(pos, forwardCoordinate, fieldCoordinate, nextFieldCoordinate)
                                    if (intersectionPoint != null) {
                                        let distance = pos.xyDistance(intersectionPoint)
                                        if (distance > maxFieldDistance) {
                                            maxFieldDistance = distance
                                        }

                                        if (distance < minFieldDistance) {
                                            minFieldDistance = distance
                                        }
                                    }
                                }

                                const distanceFromMidpoint = (elevation: number, height: number) => {
                                    return Math.abs((height / 2) * (Math.tan(elevation + vfov/2) + Math.tan(elevation - vfov/2)) - (minFieldDistance + maxFieldDistance)/2)
                                }

                                const farToNearWidthRatio = (elevation: number, height: number) => {
                                    const near = (height*s_width*Math.cos(vfov/2))/(2*focal*Math.cos(elevation-vfov/2))
                                    const far = (height*s_width*Math.cos(vfov/2))/(2*focal*Math.cos(elevation+vfov/2))
                                    return far/near
                                }

                                var midMidpointValue = Infinity
                                var minMidpointDistanceE = elevation_min
                                var minMidpointDistanceHeight = poleHeight

                                console.log(minFieldDistance, maxFieldDistance)

                                // Lazy minimize because I don't wanna do calculus
                                for (var e = elevation_min; e < elevation_max; e += degreesToRadians(0.05)) {
                                    const height = solutions(e)
                                    const distance = distanceFromMidpoint(e, height)
                                    const farNearRatio = farToNearWidthRatio(e, height)
                                    const val = distance + farNearRatio
                                    if (val < midMidpointValue) {
                                        midMidpointValue = val
                                        minMidpointDistanceE = e
                                        minMidpointDistanceHeight = height
                                    }
                                }

                                const newPos = pos.copy()
                                newPos.z = minMidpointDistanceHeight
                                camera.setCameraProperties({...camera.getCameraProperties(), pitch: minMidpointDistanceE, position: newPos})
                            })
                            
                        }}
                    >
                        Optimize Yaws
                    </Button>
                }
            </Paper>



        </div>);
}