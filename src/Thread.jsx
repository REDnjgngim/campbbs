import React, { useState } from "react";
import Message from "./Message";

const INITIAL_VISIBLE = 3; // 初期表示する返信数(最新順)
const ADD_VISIBLE_STEP = 5; // 「◯件表示」の件数

export default function Thread({ threadItems, messageSend }) {
    const parent = threadItems[0];
    const replies = threadItems.slice(1);
    const totalReplies = replies.length;

    // 折りたたみ表示の開始インデックス
    const [collapseFromIndex, setCollapseFromIndex] = useState(() => Math.max(0, totalReplies - INITIAL_VISIBLE));

    const visibleReplies = replies.slice(collapseFromIndex);
    const hiddenCount = collapseFromIndex;
    const isCollapsed = hiddenCount > 0;

    return (
        <>
            <Message
                key={parent.messageData.No}
                messageData={parent.messageData}
                indent={parent.depth}
                isFixed={parent.isFixed}
                messageSend={messageSend}
            />

            {isCollapsed && (
                <div className="relative my-3 flex items-center">
                    <div className="ml-6 w-4 border-t border-dashed border-gray-400"></div>

                    <div className="flex items-center gap-3 px-3 text-sm text-gray-500">
                        <button
                            className="flex cursor-pointer items-center font-bold hover:text-blue-700 hover:underline"
                            onClick={() => setCollapseFromIndex(0)}
                        >
                            <span className="i-tabler-selector align-bottom text-xl"></span>全{hiddenCount}件表示
                        </button>
                        {hiddenCount > ADD_VISIBLE_STEP && (
                            <button
                                className="flex cursor-pointer items-center font-bold hover:text-blue-700 hover:underline"
                                onClick={() => setCollapseFromIndex((prev) => Math.max(0, prev - ADD_VISIBLE_STEP))}
                            >
                                <span className="i-tabler-chevron-down align-bottom text-xl"></span>
                                {ADD_VISIBLE_STEP}件表示
                            </button>
                        )}
                    </div>

                    <div className="mr-2 flex-1 border-t border-dashed border-gray-400"></div>
                </div>
            )}

            {visibleReplies.map((item) => (
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
