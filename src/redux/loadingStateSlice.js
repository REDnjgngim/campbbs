import { createSlice } from "@reduxjs/toolkit";

const loadingStateSlice = createSlice({
    name: "loadingState",
    initialState: {
        isLoadingState: false,
    },
    reducers: {
        setLoadingState: (state, action) => {
            state.isLoadingState = action.payload;
        },
    },
});

export const { setLoadingState } = loadingStateSlice.actions;
export default loadingStateSlice.reducer;
