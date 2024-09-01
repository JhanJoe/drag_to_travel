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

    useEffect(() => {
        if (trip) {
            setName(trip.name);
            setStartDate(trip.startDate);
            setEndDate(trip.endDate);
            setNotes(trip.notes);
        } else {
            setName("");
            setStartDate("");
            setEndDate("");
            setNotes("");
        }
    }, [trip]);

    const handleSubmit = () => {
        const newTrip = {
            ...(trip?.id ? { id: trip.id } : {}),
            name,
            startDate,
            endDate,
            notes,
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
            <input
            type="date"
            className="mb-4 p-2 border rounded w-full"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            />
            <input
            type="date"
            className="mb-4 p-2 border rounded w-full"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            />
            <input
            type="text"
            placeholder="備註"
            className="mb-4 p-2 border rounded w-full"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            />
            <button
            onClick={handleSubmit}
            className="bg-custom-reseda-green text-white p-2 rounded w-full"
            >
            儲存
            </button>
            <button
            onClick={onClose}
            className="mt-4 w-full"
            >
            取消
            </button>
        </div>
        </div>
    );
};

export default TripModal;
