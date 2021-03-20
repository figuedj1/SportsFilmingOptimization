import React, { useMemo } from 'react'
import { EnvironmentRenderer3D } from './3D/EnvironmentRenderer3D'
import { useEditorState } from '../providers/Editor'
import { EnvironmentRenderer2D } from './2D/EnvironmentRenderer2D'

export type RenderMode = "2D" | "3D"

interface EnvironmentRendererProps {
    style?: React.CSSProperties
}

export const EnvironmentRenderer: React.FC<EnvironmentRendererProps> = ({style}) => {
    const editor = useEditorState()
    const env2d = useMemo(() => <EnvironmentRenderer2D />, [])
    const env3d = useMemo(() => <EnvironmentRenderer3D />, [])

    var environmentElement
    if (editor.currentRenderMode == "2D") {
        environmentElement = env2d
    } else {
        environmentElement = env3d
    }

    return (
        <div style={{...style, display: "flex"}}>
            {environmentElement}
        </div>
    )
}