import { configureStore } from "@reduxjs/toolkit";
import bbsTableReducer from "./bbsTableSlice";
import HAKONIWADataReducer from "./HAKONIWADataSlice";
import toastReducer from "./toastSlice";
import { campApi } from "./rtk_query";

export const store = configureStore({
    reducer: {
        bbsTable: bbsTableReducer,
        HAKONIWAData: HAKONIWADataReducer,
        toast: toastReducer,
        [campApi.reducerPath]: campApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(campApi.middleware),
});
