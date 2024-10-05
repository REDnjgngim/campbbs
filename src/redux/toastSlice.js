import { createSlice } from "@reduxjs/toolkit";

export const toastSlice = createSlice({
    name: "toast",
    initialState: {
        // 連続送信でも表示できるように配列で管理
        messages: [],
        success: [],
    },
    reducers: {
        showToast: (state, action) => {
            const { description, success } = action.payload;
            state.messages.push(description);
            state.success.push(success);
        },
        hideToast: (state) => {
            state.messages.shift();
            state.success.shift();
        },
    },
});

export const { showToast, hideToast } = toastSlice.actions;
export default toastSlice.reducer;
