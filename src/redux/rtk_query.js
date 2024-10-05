import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { showToast } from "./toastSlice"; // トーストメッセージを表示するためのアクション

const baseHeaders = (headers) => {
    headers.set("Content-Type", "application/json");
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
    const message = successMessage(args.formType);
    if (result.error) {
        // エラーが発生した場合の処理
        api.dispatch(
            showToast({ description: `エラーが発生しました`, success: false })
        );
    } else {
        api.dispatch(showToast({ description: message, success: true }));
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
            query: ({ campId, subMethod, newMessage, formType }) => ({
                method: "post",
                url: `/api/camps/${campId}/${subMethod}`,
                body: newMessage, // dataをbodyに変更
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
export const { useGetCampBbsTableQuery, useUpdateCampBbsTableMutation } =
    campApi;
