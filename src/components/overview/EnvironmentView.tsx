import { Button, Paper, Typography } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import Camera from '../../model/Camera';
import Coordinate from '../../model/Coordinate';
import { DefaultSimulatorCameraProperties, EventCamera, EventField, EventPole } from '../../model/WrappedEventModel';
import { useEnvironment } from '../Providers';
import { useEditorState } from '../providers/Editor';
import { EnvironmentListing } from './EnvironmentListing';

interface EnvironmentViewProps {
    style?: React.CSSProperties
}

export const EnvironmentView: React.FC<EnvironmentViewProps> = ({style}) => {
        const environment = useEnvironment()
        const editor = useEditorState()
        const [field, setField] = useState<EventField>(environment.getField())
        const [cameras, setCameras] = useState<EventCamera[]>(environment.getCameras())
        const [poles, setPoles] = useState<EventPole[]>(environment.getPoles())

        useEffect(() => {
            const callback = (camera: Camera) => {
                setCameras([...environment.getCameras()])
            }

            const fieldCallback = (coords: Coordinate[], eField: EventField) => {
                setField(eField)
            }
            environment.fieldDimensionsModified.push(fieldCallback)
            environment.cameraNonRenderPropsModified.push(callback)
        }, [])

        
        return (
            <div 
                style={style}
                onClick={e => {
                    // Unselect object if clicked outside 
                    if (e.target !== e.currentTarget) { return }
                    editor.setCurrentSelectedObject(null)
                }}
            >
                <EnvironmentListing identifiable={field} materialIcon="grid_on" name="Field" />
                <Paper 
                    elevation={0}
                    variant="outlined"
                    color="primary"

                    style={{
                        display: "flex",
                        alignItems: "center",

                        paddingLeft: 8
                    }}
                    >
                    <Typography variant="h6">Cameras</Typography>
                    <Button 
                        color="primary"
                        onClick={() => {
                            environment.addCamera(new EventCamera(DefaultSimulatorCameraProperties))    
                        }}
                    >Add Camera</Button>
                </Paper>
                {
                    cameras.map((camera) => {
                        return (<EnvironmentListing key={camera.id} identifiable={camera} materialIcon="videocam" name={(camera as EventCamera).getCameraProperties().name ?? "Camera"} />)
                    })
                } 
                
            </div>
        );
}