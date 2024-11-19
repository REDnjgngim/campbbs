import React, { useState, useEffect } from "react";
import InputMultiImageForm from "./InputMultiImageForm";
import { useDispatch, useSelector } from "react-redux";
import { formSave } from "./redux/formTypeParamSlice";
import { createSelector } from "reselect";

const SelectSaveform = createSelector(
    (state) => state.formTypeParam,
    (formTypeParam) => ({
        new: formTypeParam.new,
        reply: formTypeParam.reply,
        edit: formTypeParam.edit,
        diplomacy: formTypeParam.diplomacy,
    }),
);

export default function PostForm({ formType, MessageNo, messageSend }) {
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
    const formData = useSelector(SelectSaveform);
    const dispatch = useDispatch();
    const isLoadingState = useSelector((state) => state.loadingState.isLoadingState);

    // 文字数上限
    const MAX_TITLE_LENGTH = 50;
    const MAX_NAME_LENGTH = 20;
    const MAX_CONTENT_LENGTH = 1000;

    useEffect(() => {
        setIsSubmitDisabled(!formData[formType].content);
    }, [formData, formType]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        dispatch(
            formSave({
                formType,
                formName: name,
                formValue: value,
            }),
        );
    };

    return (
        <div className="max-h-[90vh] basis-full" onClick={(e) => e.stopPropagation()}>
            <form
                className="flex max-h-[90vh] w-full grow flex-col overflow-y-auto bg-white p-5"
                onSubmit={(e) => {
                    e.preventDefault();
                    messageSend(e.target, formType);
                }}
            >
                <h1 className="mb-3 text-2xl font-bold">{formHeaderName(formType)}</h1>
                <input type="hidden" name="targetNo" value={MessageNo} hidden />
                <input type="hidden" name="newNo" value={formType === "edit" ? MessageNo : "0"} hidden />
                <input
                    type="text"
                    name="title"
                    value={formData[formType].title || ""}
                    placeholder="タイトル (省略可)"
                    className="mb-2 border p-2"
                    onChange={handleInputChange}
                    maxLength={MAX_TITLE_LENGTH}
                />
                <input
                    type="text"
                    name="name"
                    value={formData[formType].name || ""}
                    placeholder="名前 (省略可)"
                    className="mb-2 border p-2"
                    onChange={handleInputChange}
                    maxLength={MAX_NAME_LENGTH}
                />
                <textarea
                    name="content"
                    placeholder="内容"
                    className="mb-2 h-36 border p-2"
                    value={formData[formType].content || ""}
                    style={{ color: formData[formType].color }}
                    onChange={handleInputChange}
                    maxLength={MAX_CONTENT_LENGTH}
                />
                {formType !== "edit" && <InputMultiImageForm />}
                <div className="flex">
                    <div className="">
                        <SelectColor textColor={formData[formType].color || ""} handleInputChange={handleInputChange} />
                        {formType === "diplomacy" && <SelectCamp />}
                    </div>
                    <div className="ml-auto mt-auto">
                        <button
                            type="submit"
                            className={`m-2 rounded border-none bg-blue-600 px-8 py-4 text-xl font-bold text-white transition duration-100 ${isSubmitDisabled || isLoadingState ? "brightness-50" : "hover:brightness-110 active:scale-95 active:brightness-75"}`}
                            disabled={isSubmitDisabled || isLoadingState}
                        >
                            {formButtonName(formType)}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

function SelectColor({ textColor, handleInputChange }) {
    const colors = [
        { value: "black", label: "黒" },
        { value: "maroon", label: "茶" },
        { value: "red", label: "赤" },
        { value: "orangered", label: "橙" },
        { value: "coral", label: "薄橙" },
        { value: "gold", label: "黄色" },
        { value: "limegreen", label: "薄緑" },
        { value: "green", label: "緑" },
        { value: "deepskyblue", label: "水色" },
        { value: "blue", label: "青" },
        { value: "navy", label: "深青" },
        { value: "purple", label: "紫" },
        { value: "deeppink", label: "深桃" },
        { value: "violet", label: "薄紫" },
    ];

    return (
        <div className="mb-2 flex items-center self-start">
            <div className="mr-3">文字色</div>
            <select className="border p-2" onChange={handleInputChange} name="color" value={textColor}>
                {colors.map((color) => (
                    <option className="font-bold" key={color.value} value={color.value} style={{ color: color.value }}>
                        {color.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

function SelectCamp() {
    const HcampLists = useSelector((state) => state.HAKONIWAData.campLists);
    const HcampId = useSelector((state) => state.HAKONIWAData.campId);

    return (
        <div className="mb-2 flex items-center self-start">
            <div className="mr-3">送信先</div>
            <select className="border p-2" name="targetCampId">
                {Object.entries(HcampLists).map(
                    ([key, { name, mark }]) =>
                        key !== HcampId && (
                            <option key={key} value={key}>
                                {mark}
                                {name}
                            </option>
                        ),
                )}
            </select>
        </div>
    );
}

function formHeaderName(formType) {
    switch (formType) {
        case "new":
            return "新規投稿";
        case "reply":
            return "返信";
        case "edit":
            return "編集モード";
        case "diplomacy":
            return "外交文書";
    }
}

function formButtonName(formType) {
    switch (formType) {
        case "new":
            return "投稿";
        case "reply":
            return "投稿";
        case "edit":
            return "編集";
        case "diplomacy":
            return "送信";
    }
}
