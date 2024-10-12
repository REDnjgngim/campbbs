import React from "react";
import { useDispatch } from "react-redux";
import { modalToggle } from "./redux/modalWindowSlice";

export default function FixedFooterButtons({ bbsTable_reload }) {
    const dispatch = useDispatch();

    return (
        <>
            <div className="fixed bottom-4 left-4">
                <button className="mb-3 rounded-full border bg-white p-4 shadow-md" onClick={bbsTable_reload}>
                    <span className="RELOAD text-3xl"></span>
                </button>
            </div>
            <div className="fixed bottom-4 right-4 mb-2">
                <button
                    className="m-2 rounded border-none bg-blue-600 p-5 text-white shadow-md"
                    onClick={() => dispatch(modalToggle({ modalType: "new", contentParam: "0" }))}
                >
                    新規投稿
                </button>
                <button
                    className="m-2 rounded border-none bg-blue-600 p-5 text-white shadow-md"
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
