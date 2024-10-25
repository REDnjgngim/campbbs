import React from "react";
import "./App.css";
import "./index.css";
import BbsMessages from "./BbsMessages.jsx";
import FixedFooterButtons from "./FixedFooterButtons.jsx";
import ModalWindow from "./ModalWindow";
import Toast from "./Toast";
import { useSelector, useDispatch } from "react-redux";
import { useUpdateCampBbsTableMutation } from "./redux/rtk_query";
import { setLoadingState } from "./redux/loadingStateSlice.js";
import { createSelector } from "reselect";
import { message_newPost, message_edit, message_pin, message_delete } from "./postManager.js";

const selectHAKONIWAData = createSelector(
    (state) => state.HAKONIWAData,
    (HAKONIWAData) => ({
        HislandId: HAKONIWAData.islandId,
        HislandPassword: HAKONIWAData.islandPassword,
        HislandName: HAKONIWAData.islandName,
        HcampId: HAKONIWAData.campId,
        HviewLastTime: HAKONIWAData.viewLastTime,
        HcampLists: HAKONIWAData.campLists,
        HislandTurn: HAKONIWAData.islandTurn,
    }),
);

function App() {
    const HAKONIWAData = useSelector(selectHAKONIWAData);
    const { HcampId, HcampLists } = useSelector(selectHAKONIWAData);
    const isModalOpen = useSelector((state) => state.modalWindow.viewType !== "close");
    const [updateCampBbsTable] = useUpdateCampBbsTableMutation();
    const dispatch = useDispatch();

    const messageSend = (form, formType) => {
        let updateType = formType;
        if (updateType === "diplomacy") updateType = "new"; // 外交文書はnewと同じ扱い
        let createMessage;
        switch (formType) {
            case "new":
            case "diplomacy":
            case "reply":
                createMessage = message_newPost(form, HAKONIWAData, formType);
                break;
            case "edit":
                createMessage = message_edit(form);
                break;
            case "pin":
                createMessage = message_pin(form);
                break;
            case "delete":
                createMessage = message_delete(form);
                break;
        }
        if (!createMessage) {
            return false;
        }

        dispatch(setLoadingState(true));

        const formData = new FormData();
        formData.append("newMessage", JSON.stringify(createMessage));
        if (createMessage.images) {
            for (let i = 0; i < createMessage.images.length; i++) {
                formData.append("images", createMessage.images[i]);
            }
            createMessage.images = [];
        }

        // API通信
        updateCampBbsTable({
            campId: HcampId,
            subMethod: updateType,
            formData,
            formType,
        });

        return false;
    };

    const LBBSTITLE = `${HcampLists[HcampId].mark}${HcampLists[HcampId].name}陣営掲示板`;

    return (
        <div className="App">
            <h1 className="mb-8 text-2xl font-bold">{LBBSTITLE}</h1>
            <BbsMessages messageSend={messageSend} />
            <FixedFooterButtons />
            {isModalOpen && <ModalWindow messageSend={messageSend} />}
            <Toast />
        </div>
    );
}

export default App;
