import { createSlice } from "@reduxjs/toolkit";

export const bbsTableSlice = createSlice({
    name: "bbsTable",
    initialState: {
        log: [],
        timeline: [],
        defaultIndex: 3,
    },
    reducers: {
        tableReload: (state, action) => {
            const { newdata } = action.payload;
            state.log = newdata.log;
            state.timeline = newdata.timeline;
            return state;
        },
        tableAddList: (state, action) => {
            const { newdata } = action.payload;
            state.log.push(...newdata.log);
            state.timeline.push(...newdata.timeline);
            return state;
        },
    },
});

export const { tableReload, tableAddList } = bbsTableSlice.actions;

export default bbsTableSlice.reducer;
