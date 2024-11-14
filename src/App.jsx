import React from "react";
import "./App.css";
import "./index.css";
import BbsMessages from "./BbsMessages.jsx";
import FixedFooterButtons from "./FixedFooterButtons.jsx";
import ModalWindow from "./ModalWindow";
import Toast from "./Toast";
import { useSelector } from "react-redux";
import { useLazyGetAllCampBbsTableQuery, useUpdateCampBbsTableMutation } from "./redux/rtk_query";
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

const selectNewbbsTable = createSelector(
    (state) => state.bbsTable,
    (bbsTable) => ({
        log: bbsTable.log,
        timeline: bbsTable.timeline,
    }),
);

function App() {
    const HAKONIWAData = useSelector(selectHAKONIWAData);
    const newbbsTable = useSelector(selectNewbbsTable);
    const { HcampId, HcampLists } = useSelector(selectHAKONIWAData);
    const isModalOpen = useSelector((state) => state.modalWindow.viewType !== "close");
    const [updateCampBbsTable] = useUpdateCampBbsTableMutation();

    // 取得済みのメッセージ全更新
    const GET_TIMELINES = 10; // 1回に読み込む数
    const hasGroupIndex = useSelector((state) => state.bbsTable.timeline.length);
    const [trigger] = useLazyGetAllCampBbsTableQuery();
    const bbsTableFetch = () => {
        // エラーなどで0になっている場合は初期値にする
        let getIndex = hasGroupIndex < GET_TIMELINES ? GET_TIMELINES : hasGroupIndex;
        trigger({ campId: HcampId, endIndex: getIndex }, false);
    };

    const messageSend = (form, formType) => {
        let updateType = formType;
        if (updateType === "diplomacy") updateType = "new"; // 外交文書はnewと同じ扱い
        let createMessage;
        switch (formType) {
            case "new":
            case "diplomacy":
                createMessage = message_newPost(form, HAKONIWAData, formType);
                break;
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
            endIndex: newbbsTable.timeline.length,
        });

        bbsTableFetch();

        return false;
    };

    const LBBSTITLE = `${HcampLists[HcampId].mark}${HcampLists[HcampId].name}陣営掲示板`;

    return (
        <div className="App">
            <h1 className="mb-8 text-2xl font-bold">{LBBSTITLE}</h1>
            <BbsMessages messageSend={messageSend} GET_TIMELINES={GET_TIMELINES} />
            <FixedFooterButtons fetchQuery={bbsTableFetch} />
            {isModalOpen && <ModalWindow messageSend={messageSend} />}
            <Toast />
        </div>
    );
}

export default App;
