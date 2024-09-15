import { createSlice } from "@reduxjs/toolkit";
// import bbsLog from "../../public/campBbsData/campBbsLog.json"; // JSONファイルをインポート
// import bbsTimeline from "../../public/campBbsData/campBbsTimeline.json"; // JSONファイルをインポート
import { showToast } from "./toastSlice";
import { fetchBbsData } from "../api/axios";

export const bbsTableSlice = createSlice({
  name: "bbsTable",
  initialState: {
    log: [],
    timeline: {},
  },
  reducers: {
    update: (state, action) => {
      const { newdata } = action.payload; // action.payloadから必要な情報を取得
      state.log = newdata.log;
      state.timeline = newdata.timeline;
      return state;
      // let successMessage = '';
      // let success = false;
      // let errorMessage = '処理に失敗しました。';
      // let responseBbsTable;

      // switch (type) {
      //   case "NEW":
      //     responseBbsTable = messageNewTest(state, newMessage);
      //     // successMessage = `投稿しました`;
      //     // success = true;
      //     break;
      //   case "EDIT":
      //     responseBbsTable = messageEditTest(state, newMessage);
      //     // successMessage = `No.${newMessage.No}の編集に成功しました`;
      //     // success = true;
      //     break;
      //   case "REPLY":
      //     responseBbsTable = messageReplyTest(state, newMessage);
      //     // successMessage = `No.${newMessage.No}に返信しました`;
      //     // success = true;
      //     break;
      //   case "DELETE":
      //     responseBbsTable = messageDeleteTest(state, newMessage);
      //     // successMessage = `No.${newMessage.No}を削除しました`;
      //     // success = true;
      //     break;
      //   case "PIN":
      //     responseBbsTable = messagePinTest(state, newMessage);
      //     // successMessage = `No.${newMessage.No}を固定しました`;
      //     // success = true;
      //     break;
      //   case "UNPIN":
      //     responseBbsTable = messageUnPinTest(state, newMessage);
      //     // successMessage = `No.${newMessage.No}の固定を解除しました`;
      //     // success = true;
      //     break;
      //   case "RELOAD":
      //     // responseBbsTable = messageReloadTest(state);
      //     // successMessage = `No.${newMessage.No}の固定を解除しました`;
      //     // success = true;
      //     responseBbsTable = fetchBbsData("get", "/api/camps/1");
      //     break;
      //   default:
      //     responseBbsTable = state; // 変更なしでstateを返す
      // }
    },
  },
});

const messageNewTest = (state, newMessage) => {
  const campIds = [newMessage.writenCampId, ...newMessage.targetCampIds];
  campIds.forEach((id) => {
    if (!state.log[id]) {
      state.log[id] = [];
    }
    if (!state.timeline[id]) {
      state.timeline[id] = {};
    }
    let newNo = String(Object.keys(state.log[id]).length + 1);
    let updatedMessage = { ...newMessage, No: newNo }; // 新しいオブジェクトを作成
    state.log[id] = [...state.log[id], updatedMessage]; // 更新されたメッセージを追加
    state.timeline[id] = { ...state.timeline[id], [newNo]: {} };
  });
  return state;
};

const messageEditTest = (state, newMessage) => {
  const campId = newMessage.writenCampId;
  const index = state.log[campId].findIndex(
    (message) => message.No === newMessage.No,
  );
  if (index !== -1) {
    const updatedMessage = {
      ...state.log[campId][index],
      title: newMessage.title,
      owner: newMessage.owner,
      content: newMessage.content,
      contentColor: newMessage.contentColor,
    };
    state.log[campId][index] = updatedMessage;
  }

  return state;
};

const messageReplyTest = (state, newMessage) => {
  const campId = newMessage.writenCampId;
  const newNo = String(Object.keys(state.log[campId]).length + 1);
  newMessage.No = newNo;

  state.log[campId] = [...state.log[campId], newMessage];

  const addMessagesRecursively = (timelineNode, path = "") => {
    Object.keys(timelineNode).forEach((key) => {
      const newPath = path ? `${path}.${key}` : key;
      if (key === newMessage.parentId) {
        state.timeline[campId] = { ...state.timeline[campId] };
        const pathArray = newPath.split(".");
        let currentLevel = state.timeline[campId];

        // パスに従って階層を辿り、新しいメッセージを挿入
        pathArray.forEach((p, index) => {
          if (!currentLevel[p]) {
            currentLevel[p] = {};
          }
          if (index === pathArray.length - 1) {
            currentLevel[p][newNo] = {}; // 新しいメッセージを挿入
          } else {
            currentLevel = currentLevel[p]; // 次の階層へ移動
          }
        });

        return true;
      }
      if (typeof timelineNode[key] === "object") {
        const result = addMessagesRecursively(timelineNode[key], newPath);
        if (result) return true;
      }
    });
  };
  addMessagesRecursively(state.timeline[campId]);

  return state;
};

const messageDeleteTest = (state, targetMessage) => {
  const campId = targetMessage.writenCampId;
  // timelineから削除
  const removeFromTimeline = (timelineNode) => {
    Object.keys(timelineNode).forEach((key) => {
      if (key === targetMessage.No) {
        if (
          typeof timelineNode[key] === "object" &&
          Object.keys(timelineNode[key]).length === 0
        ) {
          delete timelineNode[key];
        }
      } else if (typeof timelineNode[key] === "object") {
        removeFromTimeline(timelineNode[key]);
      }
    });
  };

  removeFromTimeline(state.timeline[campId]);

  // logの更新処理
  const messageIndex = state.log[campId].findIndex(
    (message) => message.No === targetMessage.No,
  );
  if (messageIndex !== -1) {
    state.log[campId][messageIndex] = {
      ...state.log[campId][messageIndex],
      title: "このメッセージは削除されました",
      owner: "",
      islandName: "",
      content: "",
      writenTurn: -1,
      contentColor: "",
      important: false,
      images: [],
    };
  }

  return state;
};

const messagePinTest = (state, targetMessage) => {
  const campId = "1"; // 外交文書も固定できるので、ここでは1固定
  // メッセージ固定中でも他を固定ができるので、messageNo以外はfalseにする
  state.log[campId] = state.log[campId].map((message) =>
    message.No === targetMessage.No
      ? { ...message, important: true }
      : { ...message, important: false },
  );
  return state;
};

const messageUnPinTest = (state, targetMessage) => {
  const campId = "1"; // 外交文書も固定できるので、ここでは1固定
  const messageIndex = state.log[campId].findIndex(
    (message) => message.No === targetMessage.No,
  );
  if (messageIndex !== -1) {
    state.log[campId][messageIndex] = {
      ...state.log[campId][messageIndex],
      important: false,
    };
  }
  return state;
};

const messageReloadTest = (state) => {
  const campId = "1"; // ここでは1固定
  // 取得し直し
  state.log[campId] = bbsLog[campId];
  state.timeline[campId] = bbsTimeline[campId];
  return state;
};

export const update = (payload) => (dispatch) => {
  const result = dispatch(bbsTableSlice.actions.update(payload));
  // console.log(result)
  // const successMessage = result.meta.requestStatus === 'fulfilled' ? payload.toastMessage : '処理に失敗しました。';
  dispatch(showToast("通信に成功しました"));
};

export default bbsTableSlice.reducer;
