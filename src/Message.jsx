import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { update } from "./redux/bbsTableSlice";
import { createSelector } from "reselect";
import { useUpdateCampBbsTableMutation } from "./redux/rtk_query";

const selectHAKONIWAData = createSelector(
  (state) => state.HAKONIWAData,
  (HAKONIWAData) => ({
    islandId: HAKONIWAData.islandId,
    islandPassword: HAKONIWAData.islandPassword,
    islandName: HAKONIWAData.islandName,
    campId: HAKONIWAData.campId,
    viewLastTime: HAKONIWAData.viewLastTime,
    campLists: HAKONIWAData.campLists,
    islandTurn: HAKONIWAData.islandTurn,
  }),
);

const selectNewbbsTable = createSelector(
  (state) => state.bbsTable,
  (bbsTable) => ({
    log: bbsTable.log,
    timeline: bbsTable.timeline,
  }),
);

export function Message({ messageData, indent, toggleModal, modalSetting }) {
  const HAKONIWAData = useSelector(selectHAKONIWAData);
  const dispatch = useDispatch();

  const isDeletedMessage = messageData.writenTurn === -1;
  const isOwnMessage = messageData.islandId === HAKONIWAData.islandId;
  const isImportant = messageData.important;
  const isDiplomacyMessage = messageData.targetCampIds.length > 0;
  const [updateCampBbsTable] = useUpdateCampBbsTableMutation(); // mutationを定義

  const Mtitle = () => {
    let { No, title } = messageData;
    return (
      <div className="m-1 flex border-b border-gray-300 p-1 text-left">
        <div className="mb-0.5 shrink-0 border-r border-gray-300 pr-2">
          No.{No}
        </div>
        <div className="grow pl-2 font-bold">{title}</div>
      </div>
    );
  };

  const Muser = () => {
    let { owner, islandName } = messageData;
    let writenUser =
      owner === "" ? `投稿者: ${islandName}` : `投稿者: ${owner}@${islandName}`;

    if (isDeletedMessage) {
      // 削除済み
      writenUser = "";
    }

    return (
      <div className="m-1 border-b border-gray-300 p-1 text-left">
        <p>{writenUser}</p>
      </div>
    );
  };

  const Mcontent = () => {
    let { contentColor, content, images, writenCampId, targetCampIds } =
      messageData;
    let diplomacyCampName = "";

    if (isDiplomacyMessage) {
      if (writenCampId !== HAKONIWAData.campId) {
        let { name, mark } = HAKONIWAData.campLists[writenCampId];
        diplomacyCampName = `${mark}${name}から【外交文書】が届いています。`;
      } else {
        let targetCampName = [];
        targetCampIds.forEach((id) => {
          let { name, mark } = HAKONIWAData.campLists[id];
          targetCampName.push(`${mark}${name}`);
        });
        diplomacyCampName =
          targetCampName.join("、") + `に【外交文書】を送信しました。`;
      }
    }

    return (
      <div className="m-1 border-b border-gray-300 p-2">
        {isDiplomacyMessage && (
          <p className="mb-1 text-left font-bold">{diplomacyCampName}</p>
        )}
        <p className="text-left" style={{ color: contentColor }}>
          {content}
        </p>
        <div className="flex flex-wrap p-1">
          {images &&
            images.map((imgURL, index) => (
              <img
                key={index}
                src={URL.createObjectURL(imgURL)} // 仮置き
                alt={`画像 ${index + 1}`}
                className="mr-2 mt-2 size-24 max-h-24 max-w-24 cursor-pointer border object-cover"
                onClick={() => {
                  toggleModal();
                  modalSetting("image", "0", URL.createObjectURL(imgURL));
                }}
              />
            ))}
        </div>
      </div>
    );
  };

  const Mfooter = () => {
    let { No, writenTime, writenTurn } = messageData;
    const dateTime = new Date(writenTime * 1000).toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
    });

    const messageDelete = async () => {
      if (!messageData) {
        alert(`このメッセージは既に存在していません`);
        return;
      }

      if (!window.confirm(`No.${No}のメッセージを削除しますか？`)) {
        return;
      }

      const result = await updateCampBbsTable({
        campId: HAKONIWAData.campId,
        subMethod: "delete",
        newMessage: { No: `${No}` },
      }); // mutationを呼び出す
      const { data } = result;

      dispatch(update({ newdata: data })); // データを更新
    };

    const messagePin = async () => {
      if (!messageData) {
        alert(`No.${No}のメッセージは既に存在していません`);
        return;
      }

      const message = isImportant
        ? `No.${No}のメッセージの固定を解除しますか？`
        : `No.${No}のメッセージを最上部に固定しますか？`;

      if (!window.confirm(message)) {
        return;
      }

      const result = await updateCampBbsTable({
        campId: HAKONIWAData.campId,
        subMethod: "pin",
        newMessage: { No: `${No}`, important: !isImportant }
      }); // mutationを呼び出す
      const { data } = result;

      dispatch(update({ newdata: data })); // データを更新
    };

    return (
      !isDeletedMessage && (
        <div className="m-0.5 flex items-end pb-1">
          <button
            className="m-0.5 ml-1 whitespace-nowrap rounded border bg-blue-600 p-1.5 text-white"
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
                className="m-0.5 ml-1 whitespace-nowrap rounded border bg-white p-1.5"
                onClick={() => {
                  toggleModal();
                  modalSetting("edit", No);
                }}
              >
                編集
              </button>
              <button
                className="m-0.5 ml-1 whitespace-nowrap rounded border bg-red-600 p-1.5 text-white"
                onClick={() => messageDelete()}
              >
                削除
              </button>
            </>
          )}
          <button
            className="m-0.5 whitespace-nowrap rounded-full border border-dashed border-slate-500 bg-white p-1.5"
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
      className={`rounded-md ${messageBGColor} mr-auto mt-1 shadow`}
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
