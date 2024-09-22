import React, { useState, useEffect } from "react";

import "./App.css";
import "./index.css";
import { Message } from "./Message";
import ModalWindow from "./ModalWindow";
import PostForm from "./PostForm";
import ImageDisplay from "./ImageDisplay";
import Toast from "./Toast";
import { useSelector, useDispatch } from "react-redux";
import { update } from "./redux/bbsTableSlice";
import { createSelector } from "reselect";
import { useGetCampBbsTableQuery } from "./redux/rtk_query";

const selectHAKONIWAData = createSelector(
  (state) => state.HAKONIWAData,
  (HAKONIWAData) => ({
    islandTurn: HAKONIWAData.islandTurn,
    islandId: HAKONIWAData.islandId,
    islandName: HAKONIWAData.islandName,
    campId: HAKONIWAData.campId,
    campNameList: HAKONIWAData.campNameList,
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
  const dispatch = useDispatch();
  const [isModalOpen, setModalOpen] = useState(false); // モーダルの状態を管理
  const [modalContentType, setmodalContentType] = useState(""); // モーダルの状態を管理
  const [modalimgURL, setmodalimgURL] = useState(""); // モーダルの状態を管理
  const [formData, setFormData] = useState({
    new: new FormData("1"),
    reply: new FormData("1"),
    edit: new FormData("1"),
    diplomacy: new FormData("2"),
  }); // フォームデータを管理
  const [targetNo, setTargetNo] = useState("0"); // targetNoの状態を追加
  const [messageField, setMessageField] = useState("読み込み中...");
  const { data, isSuccess, refetch } = useGetCampBbsTableQuery(
    HAKONIWAData.campId,
  );

  const toggleModal = () => {
    setModalOpen(!isModalOpen);
  };

  const modalSetting = (formType, newTargetNo, imgURL) => {
    setmodalContentType(formType);
    if (newTargetNo !== "") setTargetNo(newTargetNo);
    const isSameModalWindow = targetNo === newTargetNo;

    if (formType === "image") {
      setmodalimgURL(imgURL);
    } else if (formType === "reply" && !isSameModalWindow) {
      setFormData((prevState) => ({
        ...prevState,
        [formType]: {
          ...prevState[formType],
          title: `Re:[No.${newTargetNo}]への返信`,
          content: ``,
        },
      }));
    } else if (formType === "edit" && !isSameModalWindow) {
      console.log(newbbsTable)
      const messageData = newbbsTable.log.find(
        (message) => message.No === newTargetNo,
      );
      if (messageData) {
        setFormData((prevState) => ({
          ...prevState,
          [formType]: {
            ...prevState[formType],
            title: messageData.title,
            name: messageData.owner,
            content: messageData.content,
            color: messageData.contentColor,
            images: messageData.images,
          },
        }));
      } else {
        console.error("メッセージデータが見つかりませんでした。");
      }
    } else if (formType === "new") {
      // 新規投稿後
      setFormData((prevState) => ({
        ...prevState,
        ["new"]: {
          ...prevState["new"],
          title: ``,
          content: ``,
        },
        ["diplomacy"]: {
          ...prevState["new"],
          title: ``,
          content: ``,
        },
      }));
    } else if (formType === "reply") {
      // 返信後
      setFormData((prevState) => ({
        ...prevState,
        ["reply"]: {
          ...prevState["reply"],
          title: ``,
          content: ``,
        },
      }));
    }
  };

  const saveContent = (event, formType) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [formType]: {
        ...prevState[formType],
        [name]: value,
      },
    }));
  };

  const handleSubmit_reload = () => {
    refetch();
    if (isSuccess) {
      dispatch(update({ newdata: data }));
    }
  };

  useEffect(() => {
    if (isSuccess) {
      dispatch(update({ newdata: data }));
      setMessageField(
        <BbsMessages toggleModal={toggleModal} modalSetting={modalSetting} />,
      );
    }
  }, [data, isSuccess]);

  const { campId, campNameList } = HAKONIWAData;
  const LBBSTITLE = `${campNameList[campId].mark}${campNameList[campId].name}陣営掲示板`;

  return (
    <div className="App">
      <h1 className="mb-8 text-2xl font-bold">{LBBSTITLE}</h1>
      {messageField}
      <div className="fixed bottom-5 left-5">
        <button
          className="mb-3 rounded-full border bg-white p-4 shadow-md"
          onClick={() => handleSubmit_reload()}
        >
          <span className="RELOAD text-3xl"></span>
        </button>
      </div>
      <div className="fixed bottom-5 right-5">
        <button
          className="mb-4 mr-4 rounded border-none bg-blue-600 p-5 text-white shadow-md "
          onClick={() => {
            toggleModal();
            modalSetting("new", "0");
          }}
        >
          新規投稿
        </button>
        <button
          className="rounded border-none bg-blue-600 p-5 text-white shadow-md"
          onClick={() => {
            toggleModal();
            modalSetting("diplomacy", "0");
          }}
        >
          外交文書
        </button>
      </div>
      {isModalOpen && (
        <ModalWindow onClose={() => toggleModal()}>
          {(modalContentType === "new" || modalContentType === "reply") && (
            <PostForm
              onSaveContent={saveContent}
              formData={formData}
              targetNo={targetNo}
              formType={modalContentType}
              toggleModal={toggleModal}
              modalSetting={modalSetting}
            />
          )}
          {modalContentType === "edit" && (
            <PostForm
              onSaveContent={saveContent}
              formData={formData}
              targetNo={targetNo}
              formType={modalContentType}
              toggleModal={toggleModal}
              modalSetting={modalSetting}
            />
          )}
          {modalContentType === "diplomacy" && (
            <PostForm
              onSaveContent={saveContent}
              formData={formData}
              targetNo={targetNo}
              formType={modalContentType}
              toggleModal={toggleModal}
              modalSetting={modalSetting}
            />
          )}
          {modalContentType === "image" && (
            <ImageDisplay imgURL={modalimgURL} />
          )}
        </ModalWindow>
      )}
      <Toast />
    </div>
  );
}

// 掲示板の中身を表示
function BbsMessages({ toggleModal, modalSetting }) {
  const newbbsTable = useSelector(selectNewbbsTable);
  if (!newbbsTable.log) {
    return;
  }
  let MessageArray = [];

  // bbsTable.timelineの順でMessageをMessageArrayに入れる
  const renderMessage = (messageData, depth) => {
    return (
      <Message
        key={messageData.No}
        messageData={messageData}
        indent={depth}
        toggleModal={toggleModal}
        modalSetting={modalSetting}
      ></Message>
    );
  };

  const addMessagesRecursively = (timelineNode, depth = 0) => {
    Object.keys(timelineNode).forEach((key) => {
      const messageData = newbbsTable.log.find((message) => message.No === key);
      if (messageData) {
        const message = renderMessage(messageData, depth);
        if (depth === 0) {
          MessageArray.push([message]); // 新しいグループを作成
        } else {
          MessageArray[MessageArray.length - 1].push(message);
        }
      }
      if (typeof timelineNode[key] === "object") {
        addMessagesRecursively(timelineNode[key], depth + 1);
      }
    });
  };
  addMessagesRecursively(newbbsTable.timeline);

  // MessageArrayを最新順に並び替える
  MessageArray.sort((a, b) => {
    const maxWritenTimeA = Math.max(
      ...a.map((message) => message.props.messageData.writenTime),
    );
    const maxWritenTimeB = Math.max(
      ...b.map((message) => message.props.messageData.writenTime),
    );
    return maxWritenTimeB - maxWritenTimeA;
  });

  // 最後に固定メッセージをチェックしてあったら付け足す
  const importMessage = newbbsTable.log.find(
    (message) => message.important === true,
  );
  if (importMessage) {
    MessageArray.unshift([renderMessage(importMessage, 0)]);
  }

  return (
    <>
      {MessageArray.map((messageGroup, index) => (
        <div
          key={index}
          className="mx-auto mt-4 w-11/12 rounded-sm border border-gray-300 bg-gray-200 p-1 shadow-sm ring-2 ring-gray-200 ring-offset-2"
        >
          {messageGroup}
        </div>
      ))}
    </>
  );
}

class FormData {
  constructor(
    targetCampId,
    title = "",
    name = "",
    content = "",
    color = "black",
  ) {
    this.targetCampId = targetCampId;
    this.title = title;
    this.name = name;
    this.content = content;
    this.color = color;
  }
}

export default App;
