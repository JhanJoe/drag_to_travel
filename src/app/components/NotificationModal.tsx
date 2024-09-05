import React from 'react';
import Image from 'next/image';

interface NotificationModalProps {
    isOpen: boolean;
    message: string | React.ReactNode;
    onClose: () => void;
    image?: string;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, message, onClose, image }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center m-4">
                {image && (
                    <div className="mb-4">
                        <Image src={image} alt="通知圖片" width={80} height={80} />
                    </div>
                )}
                <div className="text-lg font-semibold text-gray-800 mb-4">
                    {message}
                </div>
                <button
                    onClick={onClose}
                    className="bg-custom-atomic-tangerine text-white px-4 py-2 rounded active:scale-95 active:shadow-inner transition-all duration-300 ease-on-out hover:scale-110 transform"
                >
                    好
                </button>
            </div>
        </div>
    );
};

export default NotificationModal;
