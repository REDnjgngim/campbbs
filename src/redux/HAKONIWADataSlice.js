import { createSlice } from "@reduxjs/toolkit";

export const HAKONIWADataSlice = createSlice({
    name: "HAKONIWAData",
    initialState: {
        islandId: window.islandId,
        islandName: window.islandName,
        campId: window.campId,
        viewLastTime: window.viewLastTime,
        campLists: window.campLists,
        islandTurn: window.islandTurn,
    },
    setParam: (state, action) => {
        state.islandId = action.payload.islandId;
        state.islandName = action.payload.islandName;
        state.campId = action.payload.campId;
        state.campNameList = action.payload.campNameList;
    },
});

export const { setParam } = HAKONIWADataSlice.actions;
export default HAKONIWADataSlice.reducer;
