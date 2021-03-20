import React from 'react'
import { Typography } from '@material-ui/core';

interface NoSelectedObjectProps {

}

export const NoSelectedObject: React.FC<NoSelectedObjectProps> = ({}) => {
        return (
            <div
                style={{
                    marginTop: 32,
                    width: "100%"
                }}
            >
                <Typography variant="h5" style={{color: "gray", textAlign: "center"}}>No Selected Object</Typography>
            </div>
        );
}