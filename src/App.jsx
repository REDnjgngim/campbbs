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

function App() {
  const HAKONIWAData = useSelector(selectHAKONIWAData);
  const newbbsTable = useSelector(selectNewbbsTable);
  const dispatch = useDispatch();
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalContentType, setmodalContentType] = useState("");
  const [modalimgURL, setmodalimgURL] = useState("");
  const [formTemplate, setformTemplate] = useState("");
  const [messageField, setMessageField] = useState("読み込み中...");
  const { data, isSuccess, refetch } = useGetCampBbsTableQuery(
    HAKONIWAData.campId,
  );

  const toggleModal = () => {
    setModalOpen(!isModalOpen);
  };

  const modalSetting = (formType, imgURL) => {
    setmodalContentType(formType);
    if (formType === "image") {
      setmodalimgURL(imgURL);
    }
  };

  const renderPostForm = (MessageNo, formType) => {
    setformTemplate(
      <PostForm
        formType={formType}
        toggleModal={toggleModal}
        modalSetting={modalSetting}
        MessageNo={MessageNo}
      />
    );
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
        <BbsMessages toggleModal={toggleModal} modalSetting={modalSetting} renderPostForm={renderPostForm} />,
      );
    }
  }, [data, isSuccess]);

  const { campId, campLists } = HAKONIWAData;
  const LBBSTITLE = `${campLists[campId].mark}${campLists[campId].name}陣営掲示板`;

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
            renderPostForm("0", "new");
          }}
        >
          新規投稿
        </button>
        <button
          className="rounded border-none bg-blue-600 p-5 text-white shadow-md"
          onClick={() => {
            toggleModal();
            renderPostForm("0", "diplomacy");
          }}
        >
          外交文書
        </button>
      </div>
      {isModalOpen && (
        <ModalWindow onClose={() => toggleModal()}>
          {formTemplate}
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
function BbsMessages({ toggleModal, modalSetting, renderPostForm }) {
  const newbbsTable = useSelector(selectNewbbsTable);
  if (!newbbsTable.log) {
    return;
  }
  let MessageArray = [];

  // bbsTable.timelineの順でMessageをMessageArrayに入れる
  const renderMessage = (messageData, depth, isFixed) => {
    return (
      <Message
        key={messageData.No}
        messageData={messageData}
        indent={depth}
        toggleModal={toggleModal}
        modalSetting={modalSetting}
        renderPostForm={renderPostForm}
        isFixed={isFixed}
      ></Message>
    );
  };

  const addMessagesRecursively = (timelineNode, depth = 0) => {
    Object.keys(timelineNode).forEach((key) => {
      const messageData = newbbsTable.log.find((message) => message.No === key);
      if (messageData) {
        const message = renderMessage(messageData, depth, 0);
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
    MessageArray.unshift([renderMessage(importMessage, 0, 1)]);
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

export default App;
