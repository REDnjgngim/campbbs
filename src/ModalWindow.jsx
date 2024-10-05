import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { formSave } from "./redux/formTypeParamSlice";
import { modalToggle } from "./redux/modalWindowSlice";
import { createSelector } from "reselect";

const SelectSaveform = createSelector(
    (state) => state.formTypeParam,
    (formTypeParam) => ({
        new: formTypeParam.new,
        reply: formTypeParam.reply,
        edit: formTypeParam.edit,
        diplomacy: formTypeParam.diplomacy,
    })
);

export default function ModalWindow({ messageSend }) {
    const dispatch = useDispatch();
    const ModalContentType = useSelector((state) => state.modalWindow.viewType);
    const ModalContentParam = useSelector(
        (state) => state.modalWindow.contentParam
    );
    const [modalContent, setModalContent] = useState();

    useEffect(() => {
        setModalContent(getModalContent());
        console.log(ModalContentType);
    }, [ModalContentType]);

    const getModalContent = () => {
        switch (ModalContentType) {
            case "image":
                return <ImageDisplay imgURL={ModalContentParam} />;
            default:
                return (
                    <PostForm
                        formType={ModalContentType}
                        MessageNo={ModalContentParam}
                        messageSend={messageSend}
                    />
                );
        }
    };

    return (
        <div
            onClick={() => dispatch(modalToggle({ modalType: "close" }))}
            className="fixed inset-0 flex items-center justify-center bg-black/50"
        >
            <div className="relative flex w-full max-w-4xl flex-col justify-center overflow-y-auto rounded p-5">
                <div className="basis-auto">{modalContent}</div>
                <div className="ml-auto">
                    <button
                        onClick={() =>
                            dispatch(modalToggle({ modalType: "close" }))
                        }
                        className="BATSU relative mt-2"
                    />
                </div>
            </div>
        </div>
    );
}

function PostForm({ formType, MessageNo, messageSend }) {
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
    const formData = useSelector(SelectSaveform);
    const dispatch = useDispatch();

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
            })
        );
    };

    return (
        <div
            className="max-h-[90vh] basis-full"
            onClick={(e) => e.stopPropagation()}
        >
            <form
                className="flex max-h-[90vh] w-full grow flex-col overflow-y-auto bg-white p-5"
                onSubmit={(e) => {
                    e.preventDefault();
                    messageSend(e.target, formType);
                }}
            >
                <h1 className="mb-3 text-2xl font-bold">
                    {formHeaderName(formType)}
                </h1>
                <input type="hidden" name="targetNo" value={MessageNo} hidden />
                <input
                    type="hidden"
                    name="newNo"
                    value={formType === "edit" ? MessageNo : "0"}
                    hidden
                />
                <input
                    type="text"
                    name="title"
                    value={formData[formType].title || ""}
                    placeholder="タイトル (省略可)"
                    className="mb-2 border p-2"
                    onChange={handleInputChange}
                />
                <input
                    type="text"
                    name="name"
                    value={formData[formType].name || ""}
                    placeholder="名前 (省略可)"
                    className="mb-2 border p-2"
                    onChange={handleInputChange}
                />
                <textarea
                    name="content"
                    placeholder="内容"
                    className="mb-2 h-36 border p-2"
                    value={formData[formType].content || ""}
                    style={{ color: formData[formType].color }}
                    onChange={handleInputChange}
                />
                {formType !== "edit" && <InputMultiImageForm />}
                <div className="flex">
                    <div className="">
                        <SelectColor
                            textColor={formData[formType].color || ""}
                            handleInputChange={handleInputChange}
                        />
                        {formType === "diplomacy" && <SelectCamp />}
                    </div>
                    <div className="ml-auto mt-auto">
                        <button
                            type="submit"
                            className={`m-2 rounded border-none px-8 py-4 text-xl font-bold ${isSubmitDisabled ? "bg-blue-800 text-slate-400" : "bg-blue-600 text-white"}`}
                            disabled={isSubmitDisabled}
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
            <select
                className="border p-2"
                onChange={handleInputChange}
                name="color"
                value={textColor}
            >
                {colors.map((color) => (
                    <option
                        className="font-bold"
                        key={color.value}
                        value={color.value}
                        style={{ color: color.value }}
                    >
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
                        )
                )}
            </select>
        </div>
    );
}

function ImageDisplay({ imgURL }) {
    return (
        <div className="basis-auto">
            <img
                className="mx-auto h-auto max-h-[90vh] w-fit"
                src={imgURL}
                alt={`画像`}
            />
        </div>
    );
}

function InputMultiImageForm() {
    const inputRef = useRef(null);
    const [inputFiles, setInputFiles] = useState(null);

    const selectedFileArray = useMemo(() => {
        return inputFiles ? [...Array.from(inputFiles)] : [];
    }, [inputFiles]);

    const handleChange = (e) => {
        if (!e.target.files) return;
        if (!inputRef.current?.files) return;
        const newFileArray = [
            ...selectedFileArray,
            ...Array.from(e.target.files),
        ].filter(
            (file, index, self) =>
                self.findIndex((f) => f.name === file.name) === index // 重複を削除
        );
        const dt = new DataTransfer();
        newFileArray.forEach((file) => dt.items.add(file));
        inputRef.current.files = dt.files; // input内のFileListを更新
        setInputFiles(dt.files); // Reactのstateを更新
    };

    const handleDelete = (index) => {
        if (!inputRef.current?.files) return;
        const dt = new DataTransfer();
        selectedFileArray.forEach(
            (file, i) => i !== index && dt.items.add(file)
        );
        inputRef.current.files = dt.files; // input内のFileListを更新
        setInputFiles(dt.files); // Reactのstateを更新
    };

    return (
        <div>
            <input
                type="file"
                name="images"
                className="mb-2 w-full border p-2"
                accept="image/*"
                multiple
                onChange={handleChange}
                ref={inputRef}
            />
            <div className="flex flex-row items-start gap-2">
                {selectedFileArray.map((file, index) => (
                    <div key={file.name}>
                        <div className="relative">
                            <img
                                key={index}
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="m-2 size-32 cursor-pointer object-cover hover:brightness-90"
                                onClick={() => handleDelete(index)}
                            />
                            <button className="BATSU pointer-events-none absolute right-1 top-0" />
                            <p className="mb-2 w-32 overflow-hidden text-ellipsis">
                                {file.name}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
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
