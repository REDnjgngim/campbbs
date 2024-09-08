import { configureStore } from "@reduxjs/toolkit";
import bbsTableReducer from "./bbsTableSlice";
import HAKONIWADataReducer from "./HAKONIWADataSlice";
import toastReducer from "./toastSlice";

export const store = configureStore({
  reducer: {
    bbsTable: bbsTableReducer,
    HAKONIWAData: HAKONIWADataReducer,
    toast: toastReducer,
  },
});
