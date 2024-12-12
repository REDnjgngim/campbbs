import React, { useState, useEffect, useCallback } from "react";
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

const FORM_HEADERNAME = {
    new: "新規投稿",
    reply: "返信",
    edit: "編集モード",
    diplomacy: "外交文書",
};

const FORM_BUTTONNAME = {
    new: "投稿",
    reply: "投稿",
    edit: "編集",
    diplomacy: "送信",
};

// 文字数上限
const MAX_LENGTH = {
    title: 50,
    name: 20,
    content: 1000,
};

export default function PostForm({ messageSend }) {
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
    const formData = useSelector(SelectSaveform);
    const dispatch = useDispatch();
    const MessageNo = useSelector((state) => state.modalWindow.contentParam);
    const formType = useSelector((state) => state.modalWindow.viewType);
    const { isLoadingState } = useSelector((state) => state.loadingState);

    useEffect(() => {
        setIsSubmitDisabled(!formData[formType].content);
    }, [formData, formType]);

    const handleInputChange = useCallback(
        (e) => {
            const { name, value } = e.target;
            dispatch(
                formSave({
                    formType,
                    formName: name,
                    formValue: value,
                }),
            );
        },
        [dispatch, formType],
    );

    return (
        <div className="max-h-[80dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <form
                className="flex grow flex-col bg-white p-5"
                onSubmit={(e) => {
                    e.preventDefault();
                    messageSend(e.target, formType);
                }}
            >
                <h1 className="mb-3 text-2xl font-bold">{FORM_HEADERNAME[formType]}</h1>
                <input type="hidden" name="targetNo" value={MessageNo} hidden />
                <input type="hidden" name="newNo" value={formType === "edit" ? MessageNo : "0"} hidden />
                <input
                    type="text"
                    name="title"
                    value={formData[formType].title || ""}
                    placeholder="タイトル (省略可)"
                    className="mb-2 border p-2"
                    onChange={handleInputChange}
                    maxLength={MAX_LENGTH.title}
                />
                <input
                    type="text"
                    name="name"
                    value={formData[formType].name || ""}
                    placeholder="名前 (省略可)"
                    className="mb-2 border p-2"
                    onChange={handleInputChange}
                    maxLength={MAX_LENGTH.name}
                />
                <textarea
                    name="content"
                    placeholder="内容"
                    className="mb-2 min-h-36 border p-2"
                    value={formData[formType].content || ""}
                    style={{ color: formData[formType].color }}
                    onChange={handleInputChange}
                    maxLength={MAX_LENGTH.content}
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
                            {FORM_BUTTONNAME[formType]}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

const SelectColor = React.memo(function MemoizedSelectColor({ textColor, handleInputChange }) {
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
});

const SelectCamp = React.memo(function MemoizedSelectCamp() {
    const HcampLists = useSelector((state) => state.HAKONIWAData.campLists);
    const HcampId = useSelector((state) => state.HAKONIWAData.campId);

    return (
        <div className="mb-2 flex items-center self-start">
            <div className="mr-3">送信先</div>
            <select className="border p-2" name="targetCampId">
                {HcampLists.filter((camp) => camp.id !== HcampId).map((camp) => (
                    <option key={camp.id} value={camp.id}>
                        {camp.mark}
                        {camp.name}
                    </option>
                ))}
            </select>
        </div>
    );
});
