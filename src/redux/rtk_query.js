import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { update } from "./bbsTableSlice";
import { modalToggle } from "./modalWindowSlice";
import { formReset } from "./formTypeParamSlice";
import { showToast } from "./toastSlice";

const baseHeaders = (headers) => {
    headers.set("Access-Control-Request-Headers", "origin, x-requested-with");
    return headers;
};

const baseQuery = fetchBaseQuery({
    baseUrl: "http://localhost:8080",
    mode: "cors",
    prepareHeaders: baseHeaders,
    timeout: 1000,
});

const baseQueryWithReauth = async (args, api, body) => {
    let result = await baseQuery(args, api, body);
    const { formType } = args;
    if (result.error) {
        api.dispatch(showToast({ description: `エラーが発生しました`, success: false }));
    } else {
        api.dispatch(showToast({ description: successMessage(formType), success: true }));
        api.dispatch(update({ newdata: result.data })); // データを更新
        api.dispatch(formReset({ formType })); // フォームの保持状態をリセット
        api.dispatch(modalToggle({ modalType: "close", contentParam: "" })); // モーダルウィンドウを閉じる
    }
    return result;
};

export const campApi = createApi({
    baseQuery: baseQueryWithReauth,
    endpoints: (builder) => ({
        getCampBbsTable: builder.query({
            query: (campId) => ({
                method: "get",
                url: `/api/camps/${campId}`,
            }),
        }),
        updateCampBbsTable: builder.mutation({
            query: ({ campId, subMethod, formData, formType }) => ({
                method: "post",
                url: `/api/camps/${campId}/${subMethod}`,
                body: formData, // dataをbodyに変更
                formType,
            }),
        }),
    }),
});

function successMessage(formType) {
    switch (formType) {
        case "new":
        case "diplomacy":
        case "reply":
            return "メッセージを投稿しました";
        case "edit":
            return "メッセージを編集しました";
        case "delete":
            return "メッセージを削除しました";
        default:
            return "通信に成功しました";
    }
}

// use + endpointsで設定した名前 + QueryでHooksが作られる
export const { useGetCampBbsTableQuery, useUpdateCampBbsTableMutation } = campApi;
