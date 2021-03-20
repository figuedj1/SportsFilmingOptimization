import React from 'react';
import { EventCamera, EventField } from '../../model/WrappedEventModel';
import { CameraView } from './CameraView';
import { NoSelectedObject } from './NoSelectedObject';
import { FieldView } from './FieldView';
import { useEditorState } from '../providers/Editor';

interface PropertyControlProps {
    style?: React.CSSProperties
}

export const InspectorPanel: React.FC<PropertyControlProps> = ({style}) => {
        const editor = useEditorState()

        var inspectElement
        if (editor.currentSelectedObject == null) {
            inspectElement = <NoSelectedObject />
        } else if (editor.currentSelectedObject instanceof EventCamera) {
            inspectElement = <CameraView camera={editor.currentSelectedObject as EventCamera}/>
        } else if (editor.currentSelectedObject instanceof EventField) {
            inspectElement = <FieldView field={editor.currentSelectedObject as EventField} />
        }
        return (<div style={{...style, display:"flex"}}>
            {inspectElement}
        </div>);
}