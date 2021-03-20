import React, { useState, useCallback } from 'react'
import Camera from '../../../model/Camera';
import Field from '../../../model/Field';
import { Pole } from '../../../model/Pole';
import { Dialog, DialogTitle, List, ListItemText, ListItem } from '@material-ui/core';

interface OptimizationMenuProps {
    camera: Camera,
    field: Field,
    open: boolean,
    onClose: () => void,
}

type OptimizationMethod = [string, (camera: Camera, field: Field) => void]
const OptimizationMethods:OptimizationMethod[] = [
    ["Exhaustive Search", (camera: Camera, field: Field) => {
        const pole = new Pole(camera.getCameraProperties().position, 0)
        pole.exhaustiveOptimize(camera, field)
    }],

    ["Far Corner", (camera: Camera, field: Field) => {
        const pole = new Pole(camera.getCameraProperties().position, 0)
        pole.farCornerOptimization(camera, field)
    }],

    ["Angle Bisector", (camera: Camera, field: Field) => {
        const pole = new Pole(camera.getCameraProperties().position, 0)
        pole.angleBisectorOptimization(camera, field)
    }],
]

export const OptimizationMenu: React.FC<OptimizationMenuProps> = ({camera, field, open, onClose}) => {

        const onMethodSelect = useCallback((cam: Camera, fld: Field, method: OptimizationMethod) => {
            method[1](cam, fld)
            onClose()
        }, [onClose])

        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Select Optimization Method</DialogTitle>
                <List>
                    {
                        OptimizationMethods.map((method) => (
                            <ListItem button onClick={() => {onMethodSelect(camera,field,method)}} key={method[0]}>
                                <ListItemText primary={method[0]} />
                            </ListItem>
                        ))
                    }
                </List>
            </Dialog>);
}