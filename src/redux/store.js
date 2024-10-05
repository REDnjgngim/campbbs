import { configureStore } from "@reduxjs/toolkit";
import bbsTableReducer from "./bbsTableSlice";
import HAKONIWADataReducer from "./HAKONIWADataSlice";
import toastReducer from "./toastSlice";
import formTypeParamReducer from "./formTypeParamSlice";
import modalWindowReducer from "./modalWindowSlice";
import { campApi } from "./rtk_query";

export const store = configureStore({
    reducer: {
        bbsTable: bbsTableReducer,
        HAKONIWAData: HAKONIWADataReducer,
        toast: toastReducer,
        formTypeParam: formTypeParamReducer,
        modalWindow: modalWindowReducer,
        [campApi.reducerPath]: campApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(campApi.middleware),
});
