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

export default function BbsMessages({ messageSend, GET_TIMELINES }) {
    const newbbsTable = useSelector(selectNewbbsTable);

    const HcampId = useSelector((state) => state.HAKONIWAData.campId);
    const isLoadingState = useSelector((state) => state.loadingState.isLoadingState);
    const isGetPageSkip = useRef(false);

    // データ取得クエリ
    const [getTimelineIndex, setGetTimelineIndex] = useState(0);
    const nextTimelineIndex = useRef(0);
    const FETCH_START_OFFSET = 200; // 読み込み開始位置。一番下からの距離(px)

    const { data, error, isLoading, refetch } = useGetPageCampBbsTableQuery(
        {
            campId: HcampId,
            startIndex: getTimelineIndex + GET_TIMELINES - (GET_TIMELINES - 1), // 初期値は 1
            endIndex: getTimelineIndex + GET_TIMELINES,
        },
        { skip: isGetPageSkip.current },
    );

    // 無限スクロールでのデータ取得処理
    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop >=
                    document.documentElement.offsetHeight - FETCH_START_OFFSET &&
                !isLoadingState
            ) {
                if (getTimelineIndex === nextTimelineIndex.current && !isGetPageSkip.current) {
                    // エラー等が起きると同じクエリになるので強制発行
                    refetch();
                } else {
                    setGetTimelineIndex(nextTimelineIndex.current);
                }
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [refetch, isLoadingState, setGetTimelineIndex, getTimelineIndex]);

    useEffect(() => {
        if (data) {
            if (!error) {
                // 正常にデータを受け取ったら次を受け取るために加算
                nextTimelineIndex.current += GET_TIMELINES;
            }
            if (data.timeline.length === 0 && error === undefined) {
                // 受け取ったデータが空の場合はそれ以上ないので終了
                isGetPageSkip.current = true;
            }
        }
    }, [data, error, GET_TIMELINES]);

    // スレッドフィルタ処理
    const filterOptions = ["all_thread", "ownCamp_thread", "diplomacy_thread"]; // フィルタの選択肢
    const FILTER_BUTTON_NAME = ["全て表示", "自陣営のみ", "外交文書のみ"]; // フィルタの選択肢
    const [filterIndex, setFilterIndex] = useState(0); // 現在のフィルタインデックスを管理

    const toggleFilter = () => {
        setFilterIndex((prevIndex) => (prevIndex + 1) % filterOptions.length); // インデックスを更新
    };

    if (newbbsTable.log.length === 0) {
        // 初期読み込み
        return (
            <div>
                {isLoading && <div className="LOADING-CIRCLE size-10"></div>}
                {!isLoading && error && (
                    <>
                        エラーが発生しました。
                        <br />
                        再度読み込み直してください。
                    </>
                )}
                {!isLoading && !error && (
                    <>
                        まだメッセージがありません。
                        <br />
                        新規投稿ボタンからメッセージを投稿しましょう！
                    </>
                )}
            </div>
        );
    }

    let threadArray = [];

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
                threadArray[threadArray.length - 1].push(message);
            }
            if (typeof timelineNode[key] === "object") {
                addMessagesRecursively(timelineNode[key], depth + 1);
            }
        });
    };

    newbbsTable.timeline.forEach((threadTree) => {
        threadArray.push([]);
        addMessagesRecursively(threadTree);
    });

    const importMessage = newbbsTable.log.find((message) => message.important === true);
    if (importMessage) {
        threadArray.unshift([renderMessage(importMessage, 0, 1)]);
    }

    return (
        <>
            <div className="text-right">
                <button
                    onClick={toggleFilter}
                    className={`mr-8 w-36 rounded-sm border p-2 shadow-sm ${filterOptions[filterIndex] === "all_thread" ? "bg-gray-100 ring-2 ring-gray-200" : "bg-blue-100 font-bold ring-2 ring-blue-200"}`}
                >
                    <span className="i-tabler-filter align-bottom text-xl"></span>
                    {FILTER_BUTTON_NAME[filterIndex]}
                </button>
            </div>
            {threadArray.map((thread, index) => {
                // スレッドの中の先頭で判別
                const firstMessage = thread[0];

                const targetCampIdsLength = firstMessage.props.messageData.targetCampIds.length;

                // フィルタリング処理
                const shouldDisplay = (() => {
                    if (filterOptions[filterIndex] === "diplomacy_thread") {
                        return targetCampIdsLength > 0;
                    } else if (filterOptions[filterIndex] === "ownCamp_thread") {
                        return targetCampIdsLength === 0;
                    }
                    return true; // フィルタ無しの場合は全て表示
                })();

                // フィルタONで表示しない場合は何も表示しない
                if (!shouldDisplay) {
                    return null;
                }

                return (
                    <div
                        key={index}
                        className="mx-auto mt-4 w-11/12 rounded-sm border border-gray-300 bg-gray-200 p-1 shadow-sm ring-2 ring-gray-200 ring-offset-2"
                    >
                        {thread}
                    </div>
                );
            })}
        </>
    );
}
