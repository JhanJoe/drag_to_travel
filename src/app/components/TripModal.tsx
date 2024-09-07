import React, { useState, useEffect } from "react";

interface TripModalProps {
    onClose: () => void;
    onSave: (trip: any) => void;
    trip: any | null;
}

const TripModal: React.FC<TripModalProps> = ({ onClose, onSave, trip }) => {
    const [name, setName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [notes, setNotes] = useState("");
    const [publicStatus, setPublicStatus] = useState("");
    const [startDateError, setStartDateError] = useState("");
    const [endDateError, setEndDateError] = useState("");

    useEffect(() => {
        if (trip) {
            setName(trip.name);
            setStartDate(trip.startDate);
            setEndDate(trip.endDate);
            setNotes(trip.notes);
            setPublicStatus(trip.public);
        } else {
            setName("");
            setStartDate("");
            setEndDate("");
            setNotes("");
            setPublicStatus(""); 
        }
    }, [trip]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); 

        let hasError = false;
        
        if (!startDate) {
            setStartDateError("開始日期必須填寫");
            hasError = true;
        } else {
            setStartDateError("");
        }

        if (!endDate) {
            setEndDateError("結束日期必須填寫");
            hasError = true;
        } else {
            setEndDateError("");
        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (end < start) {
                setEndDateError("結束日期應比開始日期晚");
                hasError = true;
            }
        }

        if (hasError) return;

        const newTrip = {
            ...(trip?.id ? { id: trip.id } : {}),
            name,
            startDate,
            endDate,
            notes,
            public: publicStatus,
        };
        onSave(newTrip);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96 m-4">
            <h2 className="text-2xl mb-4 text-center">{trip ? "編輯行程" : "新增行程"}</h2>
            <input
            type="text"
            placeholder="旅程名稱，如：北海道"
            className="mb-4 p-2 border rounded w-full"
            value={name}
            onChange={e => setName(e.target.value)}
            />
            <div className={`flex flex-row items-center ${startDateError ? 'mb-1' : 'mb-4'}`}>
                <span className="w-24">開始日期</span>
                <input
                type="date"
                className="p-2 border rounded w-full"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
                />
            </div>

            {startDateError && <p className="text-custom-atomic-tangerine text-sm mb-3 ml-20 transition-all duration-1000 ease-out">{startDateError}</p>}

            <div className={`flex flex-row items-center ${startDateError ? 'mb-1' : 'mb-4'}`}>
                <span className="w-24">結束日期</span>
                <input
                type="date"
                className="p-2 border rounded w-full"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                required
                />
            </div>

            {endDateError && <p className="text-custom-atomic-tangerine text-sm mb-3 ml-20 transition-all duration-1000 ease-out">{endDateError}</p>}

            <input
            type="text"
            placeholder="備註"
            className="mb-4 p-2 border rounded w-full"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            />
            <button
            onClick={handleSubmit}
            className="bg-custom-kame text-gray-600 p-2 rounded w-full active:scale-95 active:shadow-inner transition-all duration-300 ease-on-out hover:scale-105 transform "
            >
            儲存
            </button>
            <button
            onClick={onClose}
            className="mt-4 w-full active:shadow-inner transition-all duration-300 ease-on-out hover:scale-110 transform"
            >
            取消
            </button>
        </div>
        </div>
    );
};

export default TripModal;
