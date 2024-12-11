import React from "react";
import { useSelector } from "react-redux";

export default function ImageDisplay() {
    const imgURL = useSelector((state) => state.modalWindow.contentParam);

    return (
        <div className="basis-auto">
            <img className="mx-auto h-auto max-h-[90vh]" src={imgURL} alt={`画像`} />
        </div>
    );
}
