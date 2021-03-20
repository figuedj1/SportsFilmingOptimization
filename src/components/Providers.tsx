import { createContext, useContext } from "react";
import { EventEnvironment } from "../model/WrappedEventModel";

export const EnviromentProvider = createContext<EventEnvironment>({} as EventEnvironment)
export const useEnvironment = () => {
    return useContext(EnviromentProvider)
}