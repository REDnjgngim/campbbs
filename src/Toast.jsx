import { useSelector, useDispatch } from "react-redux";
import { hideToast } from "./redux/toastSlice";
import { useEffect } from "react";

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
                <div key={index} className="fixed top-0 w-9/12 left-1/2 transform -translate-x-1/2 mt-4 pt-4 pb-4 border border-blue-600 bg-gradient-to-b from-blue-50 to-blue-100/90 rounded shadow-lg z-50 animate-slideIn">
                    {message}
                </div>
            ))}
        </>
    );
};

export default Toast;
