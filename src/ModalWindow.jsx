import React, { useState, useEffect } from "react";
import PostForm from "./PostForm";
import ImageDisplay from "./ImageDisplay";
import { useDispatch, useSelector } from "react-redux";
import { modalToggle } from "./redux/modalWindowSlice";

export default function ModalWindow({ messageSend }) {
    const dispatch = useDispatch();
    const ModalContentType = useSelector((state) => state.modalWindow.viewType);
    const ModalContentParam = useSelector((state) => state.modalWindow.contentParam);
    const [isOpen_animeClass, setIsOpen_animeClass] = useState(false);
    const buttonClass_anime = "transition duration-100 hover:brightness-110 active:brightness-75 active:scale-95";

    useEffect(() => {
        if (ModalContentType !== "close") {
            setIsOpen_animeClass(true);
        }
    }, [ModalContentType]);

    if (ModalContentType === "close") {
        return <></>;
    }

    const handleClose = () => {
        setIsOpen_animeClass(false);
        setTimeout(() => dispatch(modalToggle({ modalType: "close" })), 200); // アニメーションが終わるまで待ってから閉じる
    };

    return (
        <div
            onClick={handleClose}
            className={`fixed inset-0 flex items-center justify-center bg-black/50 transition duration-200 ${isOpen_animeClass ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}
        >
            <div className="relative flex w-full max-w-4xl flex-col justify-center overflow-y-auto rounded p-5">
                <div className="basis-auto">
                    {ModalContentType === "image" && <ImageDisplay imgURL={ModalContentParam} />}
                    {ModalContentType !== "image" && (
                        <PostForm formType={ModalContentType} MessageNo={ModalContentParam} messageSend={messageSend} />
                    )}
                </div>
                <div className="ml-auto">
                    <button className={`BATSU relative mt-2 ${buttonClass_anime}`} />
                </div>
            </div>
        </div>
    );
}
