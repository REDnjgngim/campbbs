export default function ImageDisplay({ imgURL }) {
    return (
        <div className="basis-auto">
            <img
                className="w-fit mx-auto h-auto max-h-[90vh]"
                src={imgURL}
                alt={`画像`}
            />
        </div>
    );
}
