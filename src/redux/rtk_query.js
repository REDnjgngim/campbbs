import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { update } from "./bbsTableSlice";
import { modalToggle } from "./modalWindowSlice";
import { formReset } from "./formTypeParamSlice";
import { showToast } from "./toastSlice";
import { setLoadingState } from "./loadingStateSlice";

const baseHeaders = (headers) => {
    headers.set("Access-Control-Request-Headers", "origin, x-requested-with");
    return headers;
};

const baseQuery = fetchBaseQuery({
    baseUrl: "http://localhost:8080",
    mode: "cors",
    prepareHeaders: baseHeaders,
    timeout: 10000,
});

const baseQueryWithReauth = async (args, api, body) => {
    const { formType, method } = args;
    api.dispatch(setLoadingState(true)); // ボタン制御
    let result = await baseQuery(args, api, body);
    api.dispatch(setLoadingState(false)); // ボタン制御を解除
    if (result.error) {
        api.dispatch(showToast({ description: `エラーが発生しました`, success: false }));
    } else {
        if (method === "post") {
            // 投稿したメッセージを出す
            api.dispatch(showToast({ description: successMessage(formType), success: true }));
        }
        if (method === "get") {
            // getのみテーブルの更新をする
            api.dispatch(update({ newdata: result.data })); // データを更新
        }
        api.dispatch(formReset({ formType })); // フォームの保持状態をリセット
        api.dispatch(modalToggle({ modalType: "close", contentParam: "" })); // モーダルウィンドウを閉じる
    }
    return result;
};

export const campApi = createApi({
    baseQuery: baseQueryWithReauth,
    endpoints: (builder) => ({
        getCampBbsTable: builder.query({
            query: ({ campId, nowIndex, getIndex }) => ({
                method: "get",
                url: `/api/camps/${campId}/begin/${nowIndex}/end/${getIndex}`,
            }),
        }),
        updateCampBbsTable: builder.mutation({
            query: ({ campId, subMethod, formData, formType, getIndex }) => ({
                method: "post",
                url: `/api/camps/${campId}/${subMethod}/end/${getIndex}`,
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
