import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { modalToggle } from "./redux/modalWindowSlice";

export default function FixedFooterButtons({ fetchQuery }) {
    const dispatch = useDispatch();
    const isLoadingState = useSelector((state) => state.loadingState.isLoadingState);

    return (
        <>
            <div className="fixed bottom-4 left-4">
                <button
                    className={`mb-3 rounded-full border bg-white p-4 shadow-md ${!isLoadingState ? "BUTTON_ACTION_common" : "brightness-75"}`}
                    onClick={() => fetchQuery()}
                    disabled={isLoadingState}
                >
                    <span className={`block size-8 ${isLoadingState ? "LOADING-CIRCLE" : "RELOAD"}`}></span>
                </button>
            </div>
            <div className="fixed bottom-4 right-4 mb-2">
                <button
                    className={`m-2 rounded border-none bg-blue-600 p-5 font-bold text-white shadow-md ${!isLoadingState ? "BUTTON_ACTION_common" : "brightness-75"}`}
                    disabled={isLoadingState}
                    onClick={() => dispatch(modalToggle({ modalType: "new", contentParam: "0" }))}
                >
                    新規投稿
                </button>
                <button
                    className={`m-2 rounded border-none bg-blue-600 p-5 font-bold text-white shadow-md ${!isLoadingState ? "BUTTON_ACTION_common" : "brightness-75"}`}
                    disabled={isLoadingState}
                    onClick={() =>
                        dispatch(
                            modalToggle({
                                modalType: "diplomacy",
                                contentParam: "0",
                            }),
                        )
                    }
                >
                    外交文書
                </button>
            </div>
        </>
    );
}
