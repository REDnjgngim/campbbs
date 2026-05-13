import React from "react";
import Message from "./Message";

export default function Thread({ threadItems, messageSend }) {
    return (
        <>
            {threadItems.map((item) => (
                <Message
                    key={item.messageData.No}
                    messageData={item.messageData}
                    indent={item.depth}
                    isFixed={item.isFixed}
                    messageSend={messageSend}
                />
            ))}
        </>
    );
}
