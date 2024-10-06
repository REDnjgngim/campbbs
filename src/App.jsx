import React, { useState, useEffect } from "react";
import "./App.css";
import "./index.css";
import BbsMessages from "./BbsMessages.jsx";
import FixedFooterButtons from "./FixedFooterButtons.jsx";
import ModalWindow from "./ModalWindow";
import Toast from "./Toast";
import { useSelector, useDispatch } from "react-redux";
import { update } from "./redux/bbsTableSlice";
import { modalToggle } from "./redux/modalWindowSlice";
import { formReset } from "./redux/formTypeParamSlice";
import { useGetCampBbsTableQuery, useUpdateCampBbsTableMutation } from "./redux/rtk_query";
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
    const [messageField, setMessageField] = useState("読み込み中...");
    const HAKONIWAData = useSelector(selectHAKONIWAData);
    const { HcampId, HcampLists } = useSelector(selectHAKONIWAData);
    const isModalOpen = useSelector((state) => state.modalWindow.viewType !== "close");
    const dispatch = useDispatch();
    const { data, isSuccess, refetch } = useGetCampBbsTableQuery(HcampId);
    const [updateCampBbsTable] = useUpdateCampBbsTableMutation();

    const bbsTable_reload = () => {
        refetch();
        if (isSuccess) {
            dispatch(update({ newdata: data }));
        }
    };

    const messageSend = async (form, formType) => {
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

        // API通信
        const result = await updateCampBbsTable({
            campId: HcampId,
            subMethod: updateType,
            newMessage: createMessage,
            formType,
        });
        const { data } = result;

        dispatch(update({ newdata: data })); // データを更新

        if (!(formType === "pin" || formType === "delete")) {
            console.log(formType);
            dispatch(formReset({ formType })); // フォームの保持状態をリセット
            dispatch(modalToggle({ modalType: "close", contentParam: "" })); // モーダルウィンドウを閉じる
        }

        return false;
    };

    useEffect(() => {
        if (isSuccess) {
            dispatch(update({ newdata: data }));
            setMessageField(<BbsMessages messageSend={messageSend} />);
        }
    }, [data, isSuccess, dispatch]);

    const LBBSTITLE = `${HcampLists[HcampId].mark}${HcampLists[HcampId].name}陣営掲示板`;

    return (
        <div className="App">
            <h1 className="mb-8 text-2xl font-bold">{LBBSTITLE}</h1>
            {messageField}
            <FixedFooterButtons bbsTable_reload={bbsTable_reload} />
            {isModalOpen && <ModalWindow messageSend={messageSend} />}
            <Toast />
        </div>
    );
}

export default App;
