import { useSelector, useDispatch } from "react-redux";
import { hideToast } from "./redux/toastSlice";
import React, { useEffect } from "react";

const Toast = () => {
  const dispatch = useDispatch();
  const messages = useSelector((state) => state.toast.messages);

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        dispatch(hideToast());
      }, 1550); // 1.5秒後に自動で消える

      return () => clearTimeout(timer); // クリーンアップ
    }
  }, [messages, dispatch]);

  return (
    <>
      {messages.map((message, index) => (
        <div
          key={index}
          className="fixed left-1/2 top-0 z-50 mt-4 w-9/12 -translate-x-1/2 animate-slideIn rounded border border-blue-600 bg-gradient-to-b from-blue-50 to-blue-100/90 py-4 shadow-lg"
        >
          {message}
        </div>
      ))}
    </>
  );
};

export default Toast;
