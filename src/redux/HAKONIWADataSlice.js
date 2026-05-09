import { createSlice } from "@reduxjs/toolkit";

const unescapeHTML = (str) => {
    if (typeof str !== "string") return str;
    const doc = new DOMParser().parseFromString(str, "text/html");
    return doc.documentElement.textContent;
};

const initialCampLists = (window.campLists || []).map((camp) => ({
    ...camp,
    name: unescapeHTML(camp.name),
}));

export const HAKONIWADataSlice = createSlice({
    name: "HAKONIWAData",
    initialState: {
        islandId: window.islandId,
        islandName: unescapeHTML(window.islandName),
        campId: window.campId,
        viewLastTime: window.viewLastTime,
        campLists: initialCampLists,
        islandTurn: window.islandTurn,
        hako_idx: window.hako_idx,
        eventNo: window.eventNo,
        gameEnd: window.gameEnd,
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
