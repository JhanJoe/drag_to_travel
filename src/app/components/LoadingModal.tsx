import React from 'react';
import Image from 'next/image';

interface LoadingModalProps {
    isOpen: boolean;
    message: string;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ isOpen, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-transparent rounded-lg flex flex-col items-center mt-[-10vh] md:mt-[-15vh] lg:mt-[-20vh]">
                <Image
                    src="/images/loading.gif"
                    alt="Loading"
                    width={400}
                    height={400}
                    unoptimized={true}
                />
            <p className="-mt-12 text-center text-lg font-semibold text-white">
                {message}
            </p>
        </div>
        </div>
    );
};

export default LoadingModal;