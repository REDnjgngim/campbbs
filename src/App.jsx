import React, { useEffect } from "react";
import "./App.css";
import "./index.css";
import BbsMessages from "./BbsThreads.jsx";
import FixedFooterButtons from "./FixedFooterButtons.jsx";
import ModalWindow from "./ModalWindow";
import Toast from "./Toast";
import { useDispatch, useSelector } from "react-redux";
import { formSave } from "./redux/formTypeParamSlice";
import { setCookie } from "./redux/cookieSlice.js";
import { useLazyGetAllCampBbsTableQuery, useUpdateCampBbsTableMutation } from "./redux/rtk_query";
import { createSelector } from "reselect";
import { message_newPost, message_edit, message_pin, message_delete } from "./postManager.js";

const selectNewbbsTable = createSelector(
    (state) => state.bbsTable,
    (bbsTable) => ({
        log: bbsTable.log,
        timeline: bbsTable.timeline,
    }),
);

function App() {
    const HAKONIWAData = useSelector((state) => state.HAKONIWAData);
    const { islandId, campId, campLists, hako_idx, eventNo, gameEnd } = useSelector((state) => state.HAKONIWAData);
    const newbbsTable = useSelector(selectNewbbsTable);
    const [updateCampBbsTable] = useUpdateCampBbsTableMutation();
    const dispatch = useDispatch();

    // 取得済みのメッセージ全更新
    const GET_TIMELINES = 10; // 1回に読み込む数
    const hasThreadIndex = useSelector((state) => state.bbsTable.timeline.length);
    const [trigger] = useLazyGetAllCampBbsTableQuery();
    const bbsTableFetch = () => {
        // エラーなどで0になっている場合は初期値にする
        let getIndex = hasThreadIndex < GET_TIMELINES ? GET_TIMELINES : hasThreadIndex;
        trigger({ campId, hako_idx, eventNo, endIndex: getIndex, islandId }, false);
    };

    const messageSend = async (form, formType) => {
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
        if (createMessage.images) {
            for (let i = 0; i < createMessage.images.length; i++) {
                formData.append("images", createMessage.images[i]);
            }
            createMessage.images = [];
        }
        formData.append("newMessage", JSON.stringify(createMessage));

        // API通信
        const result = await updateCampBbsTable({
            campId,
            hako_idx,
            eventNo,
            subMethod: updateType,
            formData,
            formType,
            endIndex: newbbsTable.timeline.length,
        });

        if (!result.error) {
            bbsTableFetch();
        }

        if (document.cookie.includes(`cookieAgree`)) {
            const isAgree = document.cookie
                .split("; ")
                .find((row) => row.startsWith(`cookieAgree`))
                .split("=")[1];

            if (isAgree && (formType === "new" || formType === "reply")) {
                dispatch(
                    setCookie({
                        name: `owner_${hako_idx}_${eventNo}`,
                        value: createMessage.owner,
                    }),
                );
                dispatch(
                    setCookie({
                        name: `contentColor_${hako_idx}_${eventNo}`,
                        value: createMessage.contentColor,
                    }),
                );
            }
        }

        return false;
    };

    useEffect(() => {
        const loadCookies = () => {
            const getCookieValue = (name) => {
                const cookie = document.cookie.split("; ").find((row) => row.startsWith(name));
                return cookie ? cookie.split("=")[1] : null;
            };

            const updateFormData = (formName, cookieName) => {
                const cookieValue = getCookieValue(cookieName);
                if (cookieValue) {
                    ["new", "reply"].forEach((type) => {
                        dispatch(
                            formSave({
                                formType: type,
                                formName: formName,
                                formValue: decodeURIComponent(cookieValue),
                            }),
                        );
                    });
                }
            };

            updateFormData("name", `owner_${hako_idx}_${eventNo}`);
            updateFormData("color", `contentColor_${hako_idx}_${eventNo}`);
        };

        loadCookies();
    }, []);

    const index = campLists.findIndex((list) => list.id === campId);
    const CAMPNAME = (
        <>
            <span style={{ color: campLists[index].color }}>{`${campLists[index].mark}`}</span>
            {campLists[index].name}
        </>
    );

    return (
        <div className="App">
            <h1 className="mb-8 text-2xl font-bold">{CAMPNAME} 掲示板</h1>
            <BbsMessages messageSend={messageSend} GET_TIMELINES={GET_TIMELINES} />
            {!gameEnd && <FixedFooterButtons fetchQuery={bbsTableFetch} />}
            <ModalWindow messageSend={messageSend} />
            <Toast />
        </div>
    );
}

export default App;
