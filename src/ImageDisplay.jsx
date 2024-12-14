import React from "react";
import { useSelector } from "react-redux";

export default function ImageDisplay() {
    const imgURL = useSelector((state) => state.modalWindow.contentParam);

    return (
        <>
            <img className="mx-auto h-auto max-h-[80dvh]" src={imgURL} alt={`画像`} />
        </>
    );
}
