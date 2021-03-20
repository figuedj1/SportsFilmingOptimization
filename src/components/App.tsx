import React, { useEffect } from 'react';
import Coordinate from '../model/Coordinate';
import { EventEnvironment, EventField } from '../model/WrappedEventModel';
import { CamProjToolBar } from './CamProjToolBar';
import { InspectorPanel } from './inspector/InspectorPanel';
import { EnviromentProvider } from './Providers';
import { EnvironmentRenderer } from './renderer/EnvironmentRenderer';
import { EnvironmentView } from './overview/EnvironmentView';
import { EditorStateProvider } from './providers/Editor';

interface AppProps {

}

const environment = new EventEnvironment({
    cameras: [],
    field: new EventField(Coordinate.XY(-1,-1), Coordinate.XY(1,1)),
    poles: []
})

export const App: React.FC<AppProps> = ({}) => {
        useEffect(() => {
            // Add a dialog that warns the user of unsaved progress being lost
            // when the page is about to close

            window.addEventListener("beforeunload", (e: BeforeUnloadEvent) => {
                e.preventDefault()
                return "Warning: Unsaved progress will be lost!"
            })
        }, [])

        return (
            <EnviromentProvider.Provider value={environment}>
                <EditorStateProvider>
                    <div style={{width:"100%", height:"100vh", maxHeight:"100%"}}>
                        <CamProjToolBar />
                        <div style={{height: "calc(100vh - 64px)", display: "flex", flexDirection: "row", flex:1, backgroundColor: "whitesmoke"}}>
                                <EnvironmentView style={{flex:1, maxWidth:"500px"}} />
                                <EnvironmentRenderer style={{flex:3}} />
                                <InspectorPanel style={{flex:1, maxWidth:"500px"}}/>
                        </div>
                    </div>
                </EditorStateProvider>
            </EnviromentProvider.Provider>
        );
}