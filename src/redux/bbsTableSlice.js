import { createSlice } from "@reduxjs/toolkit";

export const bbsTableSlice = createSlice({
    name: "bbsTable",
    initialState: {
        log: [],
        timeline: [],
        messageIndex: 10, // 最初に読み込むグループ数
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

export const { update } = bbsTableSlice.actions;

export default bbsTableSlice.reducer;
