import { createSlice } from "@reduxjs/toolkit";

class FormData {
    constructor(title, name, content, color, targetNo) {
        this.title = title;
        this.name = name;
        this.content = content;
        this.color = color;
        this.targetNo = targetNo;
    }

    toObject() {
        return {
            title: this.title,
            name: this.name,
            content: this.content,
            color: this.color,
            targetNo: this.targetNo,
        };
    }
}

// ユーティリティ関数の定義
const initialize = (state, { formType, targetNo, messageData }) => {
    if (formType === "reply") {
        state[formType].title = `Re:[No.${targetNo}]への返信`;
    } else if (formType === "edit" && state[formType].targetNo !== targetNo) {
        state[formType] = new FormData(
            messageData.title,
            messageData.owner,
            messageData.content,
            messageData.contentColor,
            messageData.No,
        ).toObject();
    }
};

const save = (state, { formType, formName, formValue }) => {
    state[formType][formName] = formValue;
};

const reset = (state, { formType }) => {
    state[formType].title = "";
    state[formType].content = "";
};

export const formTypeParamSlice = createSlice({
    name: "formTypeParam",
    initialState: {
        new: new FormData().toObject(),
        reply: new FormData().toObject(),
        edit: new FormData().toObject(),
        diplomacy: new FormData().toObject(),
    },
    reducers: {
        formInitial: (state, action) => {
            initialize(state, action.payload);
        },
        formSave: (state, action) => {
            save(state, action.payload);
        },
        formReset: (state, action) => {
            reset(state, action.payload);
        },
    },
});

export const { formInitial, formSave, formReset } = formTypeParamSlice.actions;
export default formTypeParamSlice.reducer;
