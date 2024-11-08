import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { tableReload, tableAddList } from "./bbsTableSlice";
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
    const { formType, method, isReload } = args;
    api.dispatch(setLoadingState(true)); // ボタン制御
    let result = await baseQuery(args, api, body);
    api.dispatch(setLoadingState(false)); // ボタン制御を解除
    if (result.error) {
        api.dispatch(showToast({ description: `エラーが発生しました`, success: false }));
    } else {
        if (method === "post") {
            // 投稿したメッセージを出す
            api.dispatch(showToast({ description: successMessage(formType), success: true }));
            api.dispatch(formReset({ formType })); // フォームの保持状態をリセット
            api.dispatch(modalToggle({ modalType: "close", contentParam: "" })); // モーダルウィンドウを閉じる
        }
        if (method === "get") {
            if (isReload) {
                // メッセージを全て再更新
                api.dispatch(tableReload({ newdata: result.data }));
            } else {
                // メッセージを追加読み込み
                api.dispatch(tableAddList({ newdata: result.data }));
            }
        }
    }
    return result;
};

export const campApi = createApi({
    baseQuery: baseQueryWithReauth,
    endpoints: (builder) => ({
        getAllCampBbsTable: builder.query({
            query: ({ campId, endIndex }) => ({
                method: "get",
                url: `/api/camps/${campId}/begin/1/end/${endIndex}`,
                isReload: true,
            }),
        }),
        getPageCampBbsTable: builder.query({
            query: ({ campId, startIndex, endIndex }) => ({
                method: "get",
                url: `/api/camps/${campId}/begin/${startIndex}/end/${endIndex}`,
                isReload: false,
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
export const { useLazyGetAllCampBbsTableQuery, useGetPageCampBbsTableQuery, useUpdateCampBbsTableMutation } = campApi;
