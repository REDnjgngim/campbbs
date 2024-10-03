import { configureStore } from "@reduxjs/toolkit";
import bbsTableReducer from "./bbsTableSlice";
import HAKONIWADataReducer from "./HAKONIWADataSlice";
import toastReducer from "./toastSlice";
import formTypeParamReducer from "./formTypeParamSlice";
import { campApi } from "./rtk_query";

export const store = configureStore({
    reducer: {
        bbsTable: bbsTableReducer,
        HAKONIWAData: HAKONIWADataReducer,
        toast: toastReducer,
        formTypeParam: formTypeParamReducer,
        [campApi.reducerPath]: campApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(campApi.middleware),
});
