import React, { useState, useRef, useMemo } from "react";

export default function InputMultiImageForm() {
    const inputRef = useRef(null);
    const [inputFiles, setInputFiles] = useState(null);

    const selectedFileArray = useMemo(() => {
        return inputFiles ? [...Array.from(inputFiles)] : [];
    }, [inputFiles]);

    const handleChange = (e) => {
        if (!e.target.files) return;
        if (!inputRef.current?.files) return;
        const newFileArray = [...selectedFileArray, ...Array.from(e.target.files)].filter(
            (file, index, self) => self.findIndex((f) => f.name === file.name) === index, // 重複を削除
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
                                className="m-2 size-32 cursor-pointer object-cover transition duration-100 hover:brightness-75 active:brightness-50"
                                onClick={() => handleDelete(index)}
                            />
                            <button className="BATSU pointer-events-none absolute right-2 top-1 brightness-110" />
                            <p className="mb-2 w-32 overflow-hidden text-ellipsis">{file.name}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
