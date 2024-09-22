import { createSlice } from "@reduxjs/toolkit";
// import bbsLog from "../../public/campBbsData/campBbsLog.json"; // JSONファイルをインポート
// import bbsTimeline from "../../public/campBbsData/campBbsTimeline.json"; // JSONファイルをインポート
import { showToast } from "./toastSlice";

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
    },
  },
});

export const update = (payload) => (dispatch) => {
  const result = dispatch(bbsTableSlice.actions.update(payload));
  // console.log(result)
  // const successMessage = result.meta.requestStatus === 'fulfilled' ? payload.toastMessage : '処理に失敗しました。';
  dispatch(showToast("通信に成功しました"));
};

export default bbsTableSlice.reducer;
