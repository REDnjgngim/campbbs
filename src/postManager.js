const DIALOG_MESSAGE = {
    diplomacy: `送信した外交文書は削除出来ません。送信してもよろしいですか？`,
    noMessage: `このメッセージは既に存在していません`,
    pin: `のメッセージを最上部に固定しますか？`,
    unpin: `のメッセージの固定を解除しますか？`,
    delete: `のメッセージを削除しますか？`,
    overImages: `添付できる画像は2つまでです`,
    invalidImage: `拡張子はgif, png, jpg, jpegのみ添付出来ます。画像サイズは1つ3MBまでです`,
};

function message_newPost(form, HAKONIWAData, formType) {
    const { HislandId, HislandName, HislandTurn, HcampId } = HAKONIWAData;
    const { newNo, title, name, content, color, targetNo, targetCampId, images } = form;

    if (formType === "diplomacy" && !confirm(DIALOG_MESSAGE.diplomacy)) {
        return false;
    }

    const targetCampIds = getTargetCampIds(targetCampId);

    const validImages = validateImages(images);
    if (!validImages) {
        // validImagesがfalseの場合は処理を中断して返す
        return false;
    }

    return {
        No: newNo.value,
        title: title.value,
        owner: name.value,
        content: content.value,
        contentColor: color.value,
        islandId: HislandId,
        islandName: HislandName,
        writenTurn: HislandTurn,
        parentId: targetNo.value === newNo.value ? null : targetNo.value,
        writenCampId: HcampId,
        targetCampIds: targetCampIds,
        important: false,
        images: validImages,
    };
}

function message_edit(form) {
    return {
        No: form.newNo.value,
        title: form.title.value,
        owner: form.name.value,
        content: form.content.value,
        contentColor: form.color.value,
    };
}

function message_pin(messageData) {
    if (!messageData) {
        alert(DIALOG_MESSAGE.noMessage);
        return false;
    }
    const { No, important } = messageData;

    const message = important ? DIALOG_MESSAGE.unpin : DIALOG_MESSAGE.pin;

    if (!confirm(`No.${No}の` + message)) {
        return false;
    }

    return {
        No: `${No}`,
        important: !important,
    };
}

function message_delete(messageData) {
    const { No } = messageData;
    if (!messageData) {
        alert(DIALOG_MESSAGE.noMessage);
        return false;
    }

    if (!confirm(`No.${No}` + DIALOG_MESSAGE.delete)) {
        return false;
    }

    return {
        No: `${No}`,
    };
}

function getTargetCampIds(targetCampId) {
    let targetCampIds = [];
    if (targetCampId) {
        targetCampIds.push(targetCampId.value);
    }
    return targetCampIds;
}

function validateImages(images) {
    const validExtensions = ["gif", "png", "jpg", "jpeg"];
    const MAX_SIZE_MB = 3 * 1024 * 1024;
    const MAX_IMAGES = 2;

    if (images === undefined || images.length < 1) return [];
    images = Array.from(images.files);

    if (images.length > MAX_IMAGES) {
        alert(DIALOG_MESSAGE.overImages);
        return false;
    }

    const validImages = images.filter((image) => {
        const extension = image.name.split(".").pop().toLowerCase();
        return validExtensions.includes(extension) && image.size <= MAX_SIZE_MB;
    });

    if (validImages.length < images.length) {
        alert(DIALOG_MESSAGE.invalidImage);
        return false;
    }
    return validImages;
}

export { message_newPost, message_edit, message_pin, message_delete };
