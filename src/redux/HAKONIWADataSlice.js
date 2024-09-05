import { createSlice } from '@reduxjs/toolkit';

export const HAKONIWADataSlice = createSlice({
    name: 'HAKONIWAData',
    initialState: {
        islandTurn: 9,
        islandId: 1,
        islandName: "Nepthune島",
        campId: "1",
        campNameList: {
            "1": {name: "魏", mark:"∀"},
            "2": {name: "呉", mark:"Ψ"},
            "3": {name: "蜀", mark:"Ж"}
        },
    },
    setParam: (state, action) => {
        state.islandId = action.payload.islandId;
        state.islandName = action.payload.islandName;
        state.campId = action.payload.campId;
        state.campNameList = action.payload.campNameList;
    }
});

export const { setParam } = HAKONIWADataSlice.actions;
export default HAKONIWADataSlice.reducer;