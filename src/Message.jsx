import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { formInitial } from "./redux/formTypeParamSlice";
import { modalToggle } from "./redux/modalWindowSlice";
import { createSelector } from "reselect";

const selectHAKONIWAData = createSelector(
    (state) => state.HAKONIWAData,
    (HAKONIWAData) => ({
        HislandId: HAKONIWAData.islandId,
        HislandName: HAKONIWAData.islandName,
        HcampId: HAKONIWAData.campId,
        HviewLastTime: HAKONIWAData.viewLastTime,
        HcampLists: HAKONIWAData.campLists,
        HislandTurn: HAKONIWAData.islandTurn,
    }),
);

export default function Message({ messageData, indent, isFixed, messageSend }) {
    const { HislandId, HcampId, HviewLastTime, HcampLists } = useSelector(selectHAKONIWAData);
    const {
        No,
        title,
        writenTime,
        owner,
        islandName,
        islandId,
        contentColor,
        content,
        images,
        writenCampId,
        targetCampIds,
        writenTurn,
        important,
    } = messageData;
    const isLoadingState = useSelector((state) => state.loadingState.isLoadingState);

    const dispatch = useDispatch();
    const buttonClass_anime = "transition duration-100 hover:brightness-150 active:brightness-75 active:scale-95";

    const isDeletedMessage = writenTurn === -1;
    const isOwnMessage = islandId === HislandId;
    const isImportant = important;
    const isDiplomacyMessage = targetCampIds.length > 0;

    const Mtitle = () => {
        const newIcon = <span className="ml-1 animate-pulse text-sm text-red-500">New!</span>;

        return (
            <div className="m-1 flex border-b border-gray-300 p-1 text-left">
                <div className="mb-0.5 shrink-0 border-r border-gray-300 pr-2">No.{No}</div>
                <div className="grow break-all pl-2">
                    {title} {writenTime > HviewLastTime && newIcon}
                </div>
            </div>
        );
    };

    const Muser = () => {
        let writenUser = owner === "" ? `投稿者: ${islandName}` : `投稿者: ${owner}@${islandName}`;

        if (isDeletedMessage) {
            // 削除済み
            writenUser = "";
        }

        return (
            <div className="m-1 break-all border-b border-gray-300 p-1 text-left">
                <p>{writenUser}</p>
            </div>
        );
    };

    const Mcontent = () => {
        let diplomacyCampName = "";
        const imgPATH = "../public/campBbsData/image/";

        if (isDiplomacyMessage) {
            if (writenCampId !== HcampId) {
                let { name, mark } = HcampLists[writenCampId];
                diplomacyCampName = `${mark}${name}から【外交文書】が届いています。`;
            } else {
                let targetCampName = [];
                targetCampIds.forEach((id) => {
                    let index = HcampLists.findIndex((list) => list.id === id);
                    let { name, mark } = HcampLists[index];
                    targetCampName.push(`${mark}${name}`);
                });
                diplomacyCampName = targetCampName.join("、") + `に【外交文書】を送信しました。`;
            }
        }

        const formatedContent = (content) => {
            const texts = content.split("\n").map((item, index) => {
                return (
                    <React.Fragment key={index}>
                        {item} <br />
                    </React.Fragment>
                );
            });
            return <>{texts}</>;
        };

        return (
            <div className="m-1 border-b border-gray-300 p-2">
                {isDiplomacyMessage && <p className="mb-1 text-left font-bold">{diplomacyCampName}</p>}
                <p className="break-all text-left" style={{ color: contentColor }}>
                    {formatedContent(content)}
                </p>
                <div className="flex flex-wrap p-1">
                    {images &&
                        images.map((imgURL, index) => (
                            <img
                                key={index}
                                src={imgPATH + imgURL} // 仮置き
                                alt={`画像 ${index + 1}`}
                                className="mr-2 mt-2 size-24 max-h-24 max-w-24 cursor-pointer border object-cover"
                                onClick={() =>
                                    dispatch(
                                        modalToggle({
                                            modalType: "image",
                                            contentParam: imgPATH + imgURL,
                                        }),
                                    )
                                }
                            />
                        ))}
                </div>
            </div>
        );
    };

    const Mfooter = () => {
        const dateTime = new Date(writenTime * 1000).toLocaleString("ja-JP", {
            timeZone: "Asia/Tokyo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });

        return (
            !isDeletedMessage && (
                <div className="m-0.5 flex items-end pb-1">
                    {!isFixed && (
                        <button
                            className={`m-0.5 ml-1 p-1.5 ${!isLoadingState ? buttonClass_anime : "brightness-75"}`}
                            disabled={isLoadingState}
                            onClick={() => {
                                dispatch(
                                    formInitial({
                                        formType: "reply",
                                        targetNo: No,
                                    }),
                                );
                                dispatch(
                                    modalToggle({
                                        modalType: "reply",
                                        contentParam: No,
                                    }),
                                );
                            }}
                        >
                            <span className="i-tabler-message-dots align-bottom text-2xl text-blue-900"></span>
                        </button>
                    )}
                    {isOwnMessage && !isDiplomacyMessage && (
                        <>
                            <button
                                className={`m-0.5 ml-1 p-1.5 ${!isLoadingState ? buttonClass_anime : "brightness-75"}`}
                                disabled={isLoadingState}
                                onClick={() => {
                                    dispatch(
                                        formInitial({
                                            formType: "edit",
                                            targetNo: No,
                                            messageData,
                                        }),
                                    );
                                    dispatch(
                                        modalToggle({
                                            modalType: "edit",
                                            contentParam: No,
                                        }),
                                    );
                                }}
                            >
                                <span className="i-tabler-pencil align-bottom text-2xl text-blue-900"></span>
                            </button>
                            <button
                                className={`m-0.5 ml-1 p-1.5 ${!isLoadingState ? buttonClass_anime : "brightness-75"}`}
                                disabled={isLoadingState}
                                onClick={() => messageSend(messageData, "delete")}
                            >
                                <span className="i-tabler-trash align-bottom text-2xl text-red-600"></span>
                            </button>
                        </>
                    )}
                    <button
                        className={`m-0.5 p-1.5 ${!isLoadingState ? buttonClass_anime : "brightness-75"}`}
                        disabled={isLoadingState}
                        onClick={() => messageSend(messageData, "pin")}
                    >
                        {isImportant && (
                            <span className="i-tabler-pinned-off align-bottom text-2xl text-blue-900"></span>
                        )}
                        {!isImportant && <span className="i-tabler-pin align-bottom text-2xl text-blue-700"></span>}
                    </button>
                    <span className="ml-auto mr-1">
                        [ ターン{writenTurn} ] {dateTime}
                    </span>
                </div>
            )
        );
    };

    const getMessageBGColor = () => {
        if (isImportant) {
            return "bg-blue-100";
        } else if (targetCampIds.length) {
            return writenCampId === HcampId ? "bg-orange-100" : "bg-purple-100";
        }
        return "bg-white";
    };

    const messageBGColor = getMessageBGColor();

    const indentCap = indent > 5 ? 5 : indent;

    return (
        <div
            className={`${messageBGColor} mr-auto mt-1 shadow ${isImportant ? "" : "rounded-md"}`}
            style={{
                width: `calc(100% - ${1 + indentCap}rem)`,
                marginLeft: `${0.5 + indentCap}rem`,
            }}
        >
            <Mtitle />
            <Muser />
            <Mcontent />
            <Mfooter />
        </div>
    );
}
