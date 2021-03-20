import React, { useEffect, useState } from 'react'
import { TextField, InputAdornment } from '@material-ui/core';

interface NumericControlProps {
    value: number,
    name: string, 
    unit: string,
    unitPosition?: "start" | "end"
    onChange: (val: number) => void,
    color?: string,
    min?: number,
    max?: number,
    style?: React.CSSProperties

}

export const NumericControl: React.FC<NumericControlProps> = ({value, name, unit, onChange, color, min, max, style, unitPosition}) => {
        const [localValue, setLocalValue] = useState<string>(value.toString())


        useEffect(() => {
            setLocalValue(value.toString())
        }, [value])
        return (
            <TextField 
                style={{...style, color: color}}
                value={localValue}
                type="number"
                label={name}
                
                onChange={(event) => {
                    const currentInput = event.currentTarget.value
                    setLocalValue(currentInput)
                    if (!currentInput.endsWith(".") && currentInput != "") {
                        const number = parseFloat(currentInput)
                        onChange(number)
                    }
                }}
                inputProps={{min:min, max: max, step: "any"}}
                InputProps={{
                    endAdornment: <InputAdornment position={unitPosition ?? "end"}>{unit}</InputAdornment>
                }}
            />
        );
}