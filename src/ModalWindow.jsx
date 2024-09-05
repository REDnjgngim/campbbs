export default function ModalWindow({ onClose, children }) {
    return (
        <div
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
        >
            <div className="w-full p-5 rounded max-w-4xl relative flex flex-col justify-center overflow-y-auto">
                {children}
                <div className="ml-auto">
                    <button onClick={onClose} className="relative mt-2 BATSU" />
                </div>
            </div>
        </div>
    );
}
