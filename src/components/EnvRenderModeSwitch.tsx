import React from 'react'
import { RenderMode } from './renderer/EnvironmentRenderer';
import { Typography, Switch, FormControlLabel } from '@material-ui/core';

interface EnvRenderModeSwitchProps {
    currentMode: RenderMode,
    onSwitch: (newMode: RenderMode) => void
}

export const EnvRenderModeSwitch: React.FC<EnvRenderModeSwitchProps> = ({currentMode, onSwitch}) => {
        return (<div>
            <FormControlLabel
                control={<Switch checked={currentMode == "3D"} onChange={(e, checked) => {
                    onSwitch(checked ? "3D" : "2D")
                }} />}
                label="3D"
            />
        </div>);
}