import React from "react";

export default function ModalWindow({ onClose, children }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div className="relative flex w-full max-w-4xl flex-col justify-center overflow-y-auto rounded p-5">
        {children}
        <div className="ml-auto">
          <button onClick={onClose} className="BATSU relative mt-2" />
        </div>
      </div>
    </div>
  );
}
