import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { useSelector } from "react-redux";
import Message from "./Message";
import { createSelector } from "reselect";
import { useGetPageCampBbsTableQuery } from "./redux/rtk_query";

const selectNewbbsTable = createSelector(
    (state) => state.bbsTable,
    (bbsTable) => ({
        log: bbsTable.log,
        timeline: bbsTable.timeline,
    }),
);

export default function BbsMessages({ messageSend }) {
    const newbbsTable = useSelector(selectNewbbsTable);

    const HcampId = useSelector((state) => state.HAKONIWAData.campId);
    const isGetPageSkip = useRef(false);
    const isFetchingRef = useRef(false);

    // データ取得クエリ
    const [addTimelines, setAddTimelines] = useState(0);
    const GET_TIMELINES = 10; // 1回に読み込む数

    const { data, error, isLoading } = useGetPageCampBbsTableQuery(
        {
            campId: HcampId,
            startIndex: addTimelines + GET_TIMELINES - (GET_TIMELINES - 1), // 初期値は 1
            endIndex: addTimelines + GET_TIMELINES,
        },
        { skip: isGetPageSkip.current },
    );

    // 無限スクロールでのデータ取得処理
    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop >=
                    document.documentElement.offsetHeight - 200 &&
                !isFetchingRef.current
            ) {
                isFetchingRef.current = true;
                setAddTimelines((prevIndex) => prevIndex + GET_TIMELINES);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [isLoading]);

    useEffect(() => {
        if (data) {
            isFetchingRef.current = false;

            if (data.timeline.length === 0) {
                // 受け取ったデータが空の場合はそれ以上ないので終了
                isGetPageSkip.current = true;
            }
        }
    }, [data]);

    if (isLoading) {
        return <div className="LOADING-CIRCLE size-10"></div>;
    }

    if (error) {
        return (
            <div>
                エラーが発生しました。
                <br />
                再度読み込み直してください。
            </div>
        );
    }

    if (newbbsTable.log.length === 0) {
        return (
            <div>
                まだメッセージがありません。
                <br />
                新規投稿ボタンからメッセージを投稿しましょう！
            </div>
        );
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
            const messageData = newbbsTable.log.find((message) => message.No === key);
            if (messageData) {
                const message = renderMessage(messageData, depth, 0);
                MessageArray[MessageArray.length - 1].push(message);
            }
            if (typeof timelineNode[key] === "object") {
                addMessagesRecursively(timelineNode[key], depth + 1);
            }
        });
    };

    newbbsTable.timeline.forEach((group) => {
        MessageArray.push([]);
        addMessagesRecursively(group);
    });

    const importMessage = newbbsTable.log.find((message) => message.important === true);
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
