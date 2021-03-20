import React, { ChangeEvent } from 'react'
import { AppBar, Typography, Toolbar, Button } from '@material-ui/core';
import { useEnvironment } from './Providers';
import { useEditorState } from './providers/Editor';
import { EnvRenderModeSwitch } from './EnvRenderModeSwitch';

interface CamProjToolBarProps {

}

export const CamProjToolBar: React.FC<CamProjToolBarProps> = ({}) => {
        const environment = useEnvironment()
        const editor = useEditorState()

        return (
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" style={{flex: 1}}>Camera Project</Typography>
                    <EnvRenderModeSwitch currentMode={editor.currentRenderMode} onSwitch={newMode => {
                        editor.setRenderMode(newMode)
                    }} />
                    <Button color="inherit" onClick={() => {
                        var input = document.createElement("input")
                        input.type = "file"
                        input.hidden = true
                        document.body.appendChild(input)
                        input.click()
                        input.onchange = (ev) => {
                            let inputTarget = ev.target as HTMLInputElement
                            var envFile = inputTarget.files[0]
                            var reader = new FileReader()
                            reader.readAsText(envFile, 'UTF-8')
                            reader.onload = (readerEvent) => {
                                environment.loadFromJSON(readerEvent.target.result as string)
                                document.body.removeChild(input)
                            }
                        }
                    }}>Load</Button>
                    <Button color="inherit" onClick={() => {
                        const environmentJSON = environment.getJSONString()
                        var blob = new Blob([environmentJSON], {type:"text"})
                        var a = document.createElement("a")
                        document.body.appendChild(a)
                        const fileURL = window.URL.createObjectURL(blob)
                        a.style.setProperty("display", "none")
                        a.href = fileURL
                        a.download = "environment.json"
                        a.click()
                        window.URL.revokeObjectURL(fileURL)
                        document.body.removeChild(a)

                    }}>Save</Button> 
                </Toolbar>
            </AppBar>
        );
}