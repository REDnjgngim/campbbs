import { createApi } from "@reduxjs/toolkit/query/react";
import axios from "axios";

const axiosInstance = axios.create({
    baseURL: "http://localhost:8080",
    timeout: 2000,
    headers: {
        "Content-Type": "application/json",
    },
});

export const campApi = createApi({
    baseQuery: async (args) => {
        return axiosInstance[args.method](args.url, args.data)
            .then((response) => {
                return { data: response.data };
            })
            .catch((error) => {
                console.error("Error:", error);
                throw error;
            });
    },
    endpoints: (builder) => ({
        getCampBbsTable: builder.query({
            query: (campId) => ({
                method: "get",
                url: `/api/camps/${campId}`,
            }),
        }),
        updateCampBbsTable: builder.mutation({
          query: ({ campId, method, newMessage }) => ({
            method: method,
            url: `/api/camps/${campId}`,
            data: newMessage,
          }),
      }),
    }),
});

// use + endpointsで設定した名前 + QueryでHooksが作られる
export const { useGetCampBbsTableQuery, useUpdateCampBbsTableMutation } =
    campApi;
