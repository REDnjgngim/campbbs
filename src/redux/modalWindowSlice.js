import { createSlice } from "@reduxjs/toolkit";

export const modalWindowSlice = createSlice({
    name: "modalWindow",
    initialState: {
        // viewType = close or image or formType(new,reply,edit diplomacy)
        viewType: "close",
        // contentParam = messageNo or imgURL
        contentParam: "",
    },
    reducers: {
        modalToggle: (state, action) => {
            const { modalType, contentParam } = action.payload;
            state.viewType = modalType;
            state.contentParam = contentParam;
        },
    },
});

export const { modalToggle } = modalWindowSlice.actions;
export default modalWindowSlice.reducer;
