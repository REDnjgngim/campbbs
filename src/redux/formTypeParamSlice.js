import { createSlice } from "@reduxjs/toolkit";

class FormData {
    constructor(title, name, content, color) {
        this.title = title;
        this.name = name;
        this.content = content;
        this.color = color;
    }

    toObject() {
        return {
            title: this.title,
            name: this.name,
            content: this.content,
            color: this.color,
        };
    }
}

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
            const { formType, targetNo, messageData } = action.payload; // action.payloadから必要な情報を取得
            if (formType === "reply") {
                state[formType].title = `Re:[No.${targetNo}]への返信`;
            } else if (formType === "edit") {
                state[formType] = new FormData(
                    messageData.title,
                    messageData.owner,
                    messageData.content,
                    messageData.contentColor
                ).toObject();
            }
        },
        formSave: (state, action) => {
            const { formType, formName, formValue } = action.payload; // action.payloadから必要な情報を取得
            state[formType][formName] = formValue;
        },
        formReset: (state, action) => {
            const { formType } = action.payload; // action.payloadから必要な情報を取得
            state[formType].title = "";
            state[formType].content = "";
        },
    },
});

export const { formInitial, formSave, formReset } = formTypeParamSlice.actions;
export default formTypeParamSlice.reducer;
