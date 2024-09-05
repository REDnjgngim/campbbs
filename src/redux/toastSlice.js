import { createSlice } from '@reduxjs/toolkit';

export const toastSlice = createSlice({
    name: 'toast',
    initialState: {
        messages: [], // メッセージを配列で管理
    },
    reducers: {
        showToast: (state, action) => {
            state.messages.push(action.payload); // 新しいメッセージを追加
        },
        hideToast: (state) => {
            state.messages.shift(); // 最初のメッセージを削除
        },
    },
});

export const { showToast, hideToast } = toastSlice.actions;
export default toastSlice.reducer;