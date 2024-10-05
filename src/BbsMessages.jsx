import React from "react";
import { useSelector } from "react-redux";
import Message from "./Message";
import { createSelector } from "reselect";

const selectNewbbsTable = createSelector(
    (state) => state.bbsTable,
    (bbsTable) => ({
        log: bbsTable.log,
        timeline: bbsTable.timeline,
    })
);

export default function BbsMessages({ messageSend }) {
    const newbbsTable = useSelector(selectNewbbsTable);
    if (!newbbsTable.log) {
        return null;
    }
    let MessageArray = [];

    const renderMessage = (messageData, depth, isFixed) => (
        <Message
            key={messageData.No}
            messageData={messageData}
            indent={depth}
            isFixed={isFixed}
            messageSend={messageSend}
        />
    );

    const addMessagesRecursively = (timelineNode, depth = 0) => {
        Object.keys(timelineNode).forEach((key) => {
            const messageData = newbbsTable.log.find(
                (message) => message.No === key
            );
            if (messageData) {
                const message = renderMessage(messageData, depth, 0);
                if (depth === 0) {
                    MessageArray.push([message]);
                } else {
                    MessageArray[MessageArray.length - 1].push(message);
                }
            }
            if (typeof timelineNode[key] === "object") {
                addMessagesRecursively(timelineNode[key], depth + 1);
            }
        });
    };

    addMessagesRecursively(newbbsTable.timeline);

    MessageArray.sort((a, b) => {
        const maxWritenTimeA = Math.max(
            ...a.map((message) => message.props.messageData.writenTime)
        );
        const maxWritenTimeB = Math.max(
            ...b.map((message) => message.props.messageData.writenTime)
        );
        return maxWritenTimeB - maxWritenTimeA;
    });

    const importMessage = newbbsTable.log.find(
        (message) => message.important === true
    );
    if (importMessage) {
        MessageArray.unshift([renderMessage(importMessage, 0, 1)]);
    }

    return (
        <>
            {MessageArray.map((messageGroup, index) => (
                <div
                    key={index}
                    className="mx-auto mt-4 w-11/12 rounded-sm border border-gray-300 bg-gray-200 p-1 shadow-sm ring-2 ring-gray-200 ring-offset-2"
                >
                    {messageGroup}
                </div>
            ))}
        </>
    );
}
