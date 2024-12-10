import { createSlice } from "@reduxjs/toolkit";
import Cookies from "js-cookie";

export const cookieSlice = createSlice({
    name: "cookie",
    initialState: {
        cookieAgree: Cookies.get("cookieAgree") || null,
    },
    reducers: {
        setCookie: (state, action) => {
            const { name, value } = action.payload;
            Cookies.set(name, value, { expires: 30, sameSite: "lax" }); // 1ヶ月保存
            state.value = value;
        },
    },
});

export const { setCookie } = cookieSlice.actions;
export default cookieSlice.reducer;
