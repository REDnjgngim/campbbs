import React from "react";

export default function ImageDisplay({ imgURL }) {
    return (
        <div className="basis-auto">
            <img className="mx-auto h-auto max-h-[90vh] w-fit" src={imgURL} alt={`画像`} />
        </div>
    );
}
