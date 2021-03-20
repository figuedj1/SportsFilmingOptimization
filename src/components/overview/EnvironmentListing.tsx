import { Typography } from '@material-ui/core';
import React from 'react';
import { EventCamera, Identifiable } from '../../model/WrappedEventModel';
import { isIdentifiableSelected, useEditorState } from '../providers/Editor';

interface SceneListingProps {
    identifiable: Identifiable,
    materialIcon: string,
    name: string,
}

export const EnvironmentListing: React.FC<SceneListingProps> = ({identifiable, materialIcon, name}) => {
        const editor = useEditorState()
        const selected = isIdentifiableSelected(identifiable)
        var visibilityString = ""

        if (identifiable instanceof EventCamera) {
            visibilityString = (identifiable as EventCamera).getCameraProperties().visible ? "" : " (hidden)"
        }

        return (
            <div
                onClick={(e) => { 
                    if (identifiable == editor.currentSelectedObject) {
                        editor.setCurrentSelectedObject(null)
                    } else {
                        editor.setCurrentSelectedObject(identifiable )
                    }
                    
                }}
                style={{
                    flexDirection: "row", 
                    display:"flex",
                    backgroundColor: selected ? "lightgray" : undefined,
                    padding: 8
                }}
            >
                <i className="material-icons">{materialIcon}</i>
                <Typography style={{marginLeft: 8, flex: 1}}>{name + visibilityString}</Typography>
            </div>
        );
}