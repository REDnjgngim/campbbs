import { useDispatch, useSelector } from "react-redux";
import { update } from "./redux/bbsTableSlice";
import { createSelector } from 'reselect';

const selectHAKONIWAData = createSelector(
    (state) => state.HAKONIWAData,
    (HAKONIWAData) => ({
        islandTurn: HAKONIWAData.islandTurn,
        islandId: HAKONIWAData.islandId,
        islandName: HAKONIWAData.islandName,
        campId: HAKONIWAData.campId,
        campNameList: HAKONIWAData.campNameList
    })
);

export function Message({ messageData, indent, toggleModal, modalSetting }) {
    const HAKONIWAData = useSelector(selectHAKONIWAData);
    const dispatch = useDispatch();

    const isDeletedMessage = messageData.writenTurn === -1;
    const isOwnMessage = messageData.islandId === HAKONIWAData.islandId;
    const isImportant = messageData.important;
    const isDiplomacyMessage = messageData.targetCampIds.length > 0;

    const Mtitle = () => {
        let { No, title } = messageData;
        return (
            <div className="flex m-1 p-1 border-b border-gray-300 text-left">
                <div className="border-r border-gray-300 pr-2 flex-shrink-0 mb-0.5">
                    No.{No}
                </div>
                <div className="pl-2 flex-grow font-bold">
                    {title}
                </div>
            </div>
        );
    };

    const Muser = () => {
        let { owner, islandName } = messageData;
        let writenUser = owner === ""
            ? `投稿者: ${islandName}`
            : `投稿者: ${owner}@${islandName}`;

        if (isDeletedMessage) {
            // 削除済み
            writenUser = "";
        }

        return (
            <div className="m-1 p-1 border-b border-gray-300 text-left">
                <p>{writenUser}</p>
            </div>
        );
    };

    const Mcontent = () => {
        let { contentColor, content, images, writenCampId, targetCampIds } = messageData;
        let diplomacyCampName = "";

        if (isDiplomacyMessage) {
            if (writenCampId !== HAKONIWAData.campId) {
                let { name, mark } = HAKONIWAData.campNameList[writenCampId];
                diplomacyCampName = `${mark}${name}から【外交文書】が届いています。`;
            } else {
                let targetCampName = [];
                targetCampIds.forEach(id => {
                    let { name, mark } = HAKONIWAData.campNameList[id];
                    targetCampName.push(`${mark}${name}`);
                });
                diplomacyCampName = targetCampName.join("、") + `に【外交文書】を送信しました。`;
            }
        }

        return (
            <div className="m-1 p-2 border-b border-gray-300">
                {
                    isDiplomacyMessage && (
                        <p className="text-left mb-1 font-bold">{diplomacyCampName}</p>
                    )
                }
                <p
                    className="text-left"
                    style={{ color: contentColor }}
                >
                    {content}
                </p>
                <div className="p-1 flex flex-wrap">
                    {images &&
                        images.map((imgURL, index) => (
                            <img
                                key={index}
                                src={URL.createObjectURL(imgURL)} // 仮置き
                                alt={`画像 ${index + 1}`}
                                className="object-cover cursor-pointer w-24 h-24 max-w-24 max-h-24 mr-2 mt-2 border"
                                onClick={() => {
                                    toggleModal();
                                    modalSetting(
                                        "image",
                                        "0",
                                        URL.createObjectURL(imgURL)
                                    );
                                }}
                            />
                        ))}
                </div>
            </div>
        );
    };

    const Mfooter = () => {
        let { No, writenTime, writenTurn } = messageData;
        const dateTime = new Date(writenTime * 1000).toLocaleString(
            "ja-JP",
            {
                timeZone: "Asia/Tokyo",
            }
        );

        const messageDelete = () => {
            if (!messageData) {
                alert(`このメッセージは既に存在していません`);
                return;
            }

            if (
                !window.confirm(
                    `No.${No}のメッセージを削除しますか？`
                )
            ) {
                return;
            }

            dispatch(
                update({
                    type: "DELETE",
                    newMessage: messageData,
                })
            );
        };

        const messagePin = () => {
            if (!messageData) {
                alert(`このメッセージは既に存在していません`);
                return;
            }

            const [message, UPDATETYPE] = isImportant
                ? ["このメッセージの固定を解除しますか？", "UNPIN"]
                : ["このメッセージを最上部に固定しますか？", "PIN"];

            if (!window.confirm(message)) {
                return;
            }

            dispatch(
                update({
                    type: UPDATETYPE,
                    newMessage: messageData,
                })
            );
        };

        return (
            !isDeletedMessage && (
                <div className="flex items-end m-0.5 pb-1">
                    <button
                        className="ml-1 border rounded p-1.5 m-0.5 bg-blue-600 text-white whitespace-nowrap"
                        onClick={() => {
                            toggleModal();
                            modalSetting("reply", No);
                        }}
                    >
                        返信
                    </button>
                    {isOwnMessage && !isDiplomacyMessage && (
                        <>
                            <button
                                className="ml-1 border rounded p-1.5 m-0.5 bg-white whitespace-nowrap"
                                onClick={() => {
                                    toggleModal();
                                    modalSetting("edit", No);
                                }}
                            >
                                編集
                            </button>
                            <button
                                className="ml-1 border rounded p-1.5 m-0.5 bg-red-600 text-white whitespace-nowrap"
                                onClick={() => messageDelete()}
                            >
                                削除
                            </button>
                        </>
                    )}
                    <button
                        className="border border-slate-500 border-dashed p-1.5 m-0.5 bg-white whitespace-nowrap rounded-full"
                        onClick={() => messagePin()}
                    >
                        {isImportant && "解除"}
                        {!isImportant && "固定"}
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
        } else if (messageData.targetCampIds.length) {
            return messageData.writenCampId === HAKONIWAData.campId
                ? "bg-orange-100"
                : "bg-purple-100";
        }
        return "bg-white";
    };

    const messageBGColor = getMessageBGColor();

    return (
        <div
            className={`rounded-md ${messageBGColor} mt-1 shadow mr-auto`}
            style={{
                width: `calc(100% - ${1 + indent}rem)`,
                marginLeft: `${0.5 + indent}rem`,
            }}
        >
            <Mtitle />
            <Muser />
            <Mcontent />
            <Mfooter />
        </div>
    );
}
