import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseHeaders = (headers) => {
  headers.set('Content-Type', 'application/json');
  headers.set('Access-Control-Request-Headers', 'origin, x-requested-with');
  return headers;
};

export const campApi = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:8080",
    mode: 'cors',
    // credentials: 'include',
    prepareHeaders: baseHeaders,
    timeout: 2000,
  }),
  endpoints: (builder) => ({
    getCampBbsTable: builder.query({
      query: (campId) => ({
        method: "get",
        url: `/api/camps/${campId}`,
      }),
    }),
    updateCampBbsTable: builder.mutation({
      query: ({ campId, subMethod, newMessage }) => ({
        method: "post",
        url: `/api/camps/${campId}/${subMethod}`,
        body: newMessage, // dataをbodyに変更
      }),
    }),
  }),
});

// use + endpointsで設定した名前 + QueryでHooksが作られる
export const { useGetCampBbsTableQuery, useUpdateCampBbsTableMutation } =
  campApi;
