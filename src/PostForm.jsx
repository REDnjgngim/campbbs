import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { update } from "./redux/bbsTableSlice";
import { createSelector } from "reselect";
import { useUpdateCampBbsTableMutation } from "./redux/rtk_query";

const selectHAKONIWAData = createSelector(
  (state) => state.HAKONIWAData,
  (HAKONIWAData) => ({
    islandTurn: HAKONIWAData.islandTurn,
    islandId: HAKONIWAData.islandId,
    islandName: HAKONIWAData.islandName,
    campId: HAKONIWAData.campId,
    campNameList: HAKONIWAData.campNameList,
  }),
);

const selectNewbbsTable = createSelector(
  (state) => state.bbsTable,
  (bbsTable) => ({
    log: bbsTable.log,
    timeline: bbsTable.timeline,
  })
);

export default function PostForm({
  onSaveContent,
  formData,
  targetNo,
  formType,
  toggleModal,
  modalSetting,
  onUpdate
}) {
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  let formSet = formData[formType];
  const HAKONIWAData = useSelector(selectHAKONIWAData);
  const newbbsTable = useSelector(selectNewbbsTable);
  const dispatch = useDispatch();
  const [updateCampBbsTable] = useUpdateCampBbsTableMutation(); // mutationを定義

  useEffect(() => {
    if (formSet && formSet.content) {
      setIsSubmitDisabled(!formSet.content.trim());
    }
  }, [formSet]);

  // メッセージ投稿
  const handleSubmit_updateTypeCheck = async (form) => {
    const createNewMessage = (
      form,
      validImages,
      newNo,
      ReplyNo,
      targetCampId,
    ) => ({
      // 編集含めて全て必要
      title: form.title.value,
      owner: form.name.value,
      content: form.content.value,
      contentColor: form.color.value,
      // 新規投稿時のみ必要
      No: newNo,
      islandId: HAKONIWAData.islandId,
      islandName: HAKONIWAData.islandName,
      writenTurn: HAKONIWAData.islandTurn,
      writenTime: Math.floor(new Date().getTime() / 1000),
      parentId: ReplyNo === newNo ? null : ReplyNo,
      writenCampId: HAKONIWAData.campId,
      targetCampIds: targetCampId,
      important: false,
      images: validImages,
    });

    if (formType === "diplomacy") {
      if (
        !confirm(`送信した外交文書は削除出来ません。送信してもよろしいですか？`)
      )
        return false;
    }

    let [newNo, targetNo] = [form.newNo.value, form.targetNo.value];

    let updateType;
    let updateMethod = "post";
    if (targetNo === "0") {
      updateType = "NEW";
    } else if (targetNo === newNo) {
      updateType = "EDIT";
      updateMethod = "put";
    } else if (targetNo !== newNo) {
      updateType = "REPLY";
    }

    if (updateType !== "NEW") {
      let index = newbbsTable.log.findIndex(
        (message) => message.No === targetNo,
      );
      if (index === -1) {
        alert(`このメッセージは存在しません。`);
        return false;
      }
    }

    let targetCampIds = [];

    if (form.targetCampId) {
      targetCampIds = [...targetCampIds, form.targetCampId.value];
    }

    const validImages = validateImages(form.images);
    if (!validImages) {
      return false; // validImagesがfalseの場合は処理を中断して返す
    }

    const createMessage = createNewMessage(
      form,
      validImages,
      newNo,
      targetNo,
      targetCampIds,
    );

    const result = await updateCampBbsTable({ campId: HAKONIWAData.campId, method: updateMethod, newMessage: createMessage }); // mutationを呼び出す
    const { data } = result;

    onUpdate(data);

    toggleModal();
    modalSetting(updateType);

    return false;
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
          handleSubmit_updateTypeCheck(e.target);
        }}
      >
        <h1 className="mb-3 text-2xl font-bold">{formHeaderName(formType)}</h1>
        <input type="hidden" name="targetNo" value={targetNo} hidden />
        <input
          type="hidden"
          name="newNo"
          value={formType === "edit" ? targetNo : "0"}
          hidden
        />
        <input
          type="text"
          name="title"
          value={formSet.title}
          placeholder="タイトル (省略可)"
          className="mb-2 border p-2"
          onChange={(e) => onSaveContent(e, formType)}
        />
        <input
          type="text"
          name="name"
          value={formSet.name}
          placeholder="名前 (省略可)"
          className="mb-2 border p-2"
          onChange={(e) => onSaveContent(e, formType)}
        />
        <textarea
          name="content"
          placeholder="内容"
          className="mb-2 h-36 border p-2"
          value={formSet.content}
          style={{ color: formSet.color }}
          onChange={(e) => onSaveContent(e, formType)}
        />
        {formType !== "edit" && <InputMultiImageForm />}
        <div className="flex">
          <div className="">
            <SelectColor
              onSaveContent={onSaveContent}
              textColor={formSet.color}
              formType={formType}
            />
            {formType === "diplomacy" && (
              <SelectCamp
                onSaveContent={onSaveContent}
                selectedCamp={formSet.targetCampId}
                formType={formType}
                HAKONIWAData={HAKONIWAData}
              />
            )}
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

function SelectColor({ onSaveContent, textColor, formType }) {
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
        onChange={(e) => onSaveContent(e, formType)}
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

function SelectCamp({ onSaveContent, selectedCamp, formType, HAKONIWAData }) {
  return (
    <div className="mb-2 flex items-center self-start">
      <div className="mr-3">送信先</div>
      <select
        className="border p-2"
        onChange={(e) => onSaveContent(e, formType)}
        name="targetCampId"
        value={selectedCamp}
      >
        {Object.entries(HAKONIWAData.campNameList).map(
          ([key, { name, mark }]) =>
            key !== HAKONIWAData.campId && (
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
        self.findIndex((f) => f.name === file.name) === index, // 重複を削除
    );
    const dt = new DataTransfer();
    newFileArray.forEach((file) => dt.items.add(file));
    inputRef.current.files = dt.files; // input内のFileListを更新
    setInputFiles(dt.files); // Reactのstateを更新
  };

  const handleDelete = (index) => {
    if (!inputRef.current?.files) return;
    const dt = new DataTransfer();
    selectedFileArray.forEach((file, i) => i !== index && dt.items.add(file));
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

function validateImages(images) {
  const validExtensions = ["gif", "png", "jpg", "jpeg"];
  const MAX_SIZE_MB = 3 * 1024 * 1024;
  const MAX_IMAGES = 2;

  if (images === undefined || images.length < 1) return [];
  images = Array.from(images.files);

  if (images.length > MAX_IMAGES) {
    alert("添付できる画像は2つまでです。");
    return false;
  }

  const validImages = images.filter((image) => {
    const extension = image.name.split(".").pop().toLowerCase();
    return validExtensions.includes(extension) && image.size <= MAX_SIZE_MB;
  });

  if (validImages.length < images.length) {
    alert(
      "拡張子はgif, png, jpg, jpegのみ添付出来ます。画像サイズは1つ3MBまでです",
    );
    return false;
  }
  return validImages;
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
