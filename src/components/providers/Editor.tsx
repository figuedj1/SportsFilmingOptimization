import React, { createContext, useContext, useState } from "react"
import { Identifiable } from "../../model/WrappedEventModel"
import { RenderMode } from "../renderer/EnvironmentRenderer"


export interface EditorState {
    currentSelectedObject: Identifiable,
    setCurrentSelectedObject: React.Dispatch<React.SetStateAction<Identifiable>>,
    currentRenderMode: RenderMode,
    setRenderMode: React.Dispatch<React.SetStateAction<RenderMode>>
}

export const EditorContext = createContext<EditorState>({} as EditorState)
export const useEditorState = () => {
    return useContext(EditorContext)
}

export function isIdentifiableSelected(i: Identifiable): boolean {
    const editor = useEditorState()
    if (editor.currentSelectedObject == null) {
        return false
    }
    return editor.currentSelectedObject.id === i.id
}

interface EditorStateProviderProps {

}

export const EditorStateProvider: React.FC<React.PropsWithChildren<EditorStateProviderProps>> = (props) => {
        const [ currentSelectedObject, setCurrentSelectedObject ] = useState<Identifiable>(null)
        const [ currentRenderMode, setRenderMode ] = useState<RenderMode>("2D")

        const editorState: EditorState = {
            currentSelectedObject: currentSelectedObject,
            setCurrentSelectedObject: setCurrentSelectedObject,
            currentRenderMode: currentRenderMode, 
            setRenderMode: setRenderMode
        }


        return (
            <EditorContext.Provider value={editorState}>
                {props.children}
            </EditorContext.Provider>
        );
}