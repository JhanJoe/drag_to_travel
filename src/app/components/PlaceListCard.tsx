import React, { useState } from "react";
import { FaEdit } from "react-icons/fa";
import { Place, PlaceList } from '../types/map';


interface PlaceListCardProps {
    placeList: PlaceList & { places?: Place[] };
    onDelete: (id: string) => void;
    onUpdate: (id: string, updatedTitle: string, updatedNotes: string) => void;
    children?: React.ReactNode;    
}

const PlaceListCard: React.FC<PlaceListCardProps> = ({ placeList, onDelete, onUpdate, children }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [updatedTitle, setUpdatedTitle] = useState(placeList.title);
    const [updatedNotes, setUpdatedNotes] = useState(placeList.notes);

    const handleSave = () => {
        onUpdate(placeList.id, updatedTitle, updatedNotes);
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (confirm("你確定要刪除此行程嗎？")) {
            onDelete(placeList.id);
        }
    };

    return (
        <div className="relative mb-3 p-3 border rounded-xl bg-white overflow-hidden">
            {isEditing ? (
                <>
                    <input
                        type="text"
                        value={updatedTitle}
                        onChange={(e) => setUpdatedTitle(e.target.value)}
                        className="w-full mb-2 p-2 border rounded"
                    />
                    <textarea
                        value={updatedNotes}
                        onChange={(e) => setUpdatedNotes(e.target.value)}
                        className="w-full mb-2 p-2 border rounded"
                    />
                    <button
                        onClick={handleSave}
                        className="w-full p-2 bg-blue-500 text-white rounded"
                    >
                        儲存
                    </button>
                </>
            ) : (
                <>
                    <button
                        onClick={handleDelete}
                        className="absolute top-1 right-4 text-2xl text-gray-400"
                    >
                        ×
                    </button>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="absolute top-10 right-4 text-xl text-gray-400"
                    >
                        <FaEdit />
                    </button>

                    <div className="text-lg font-bold text-center">{placeList.title}</div>
                    <div className="text-center text-gray-400">{placeList.notes}</div>
                    <div className="mt-2">
                        {placeList.places?.map((place) => (
                            <div key={place.title} className="text-center text-gray-600">
                                {place.title}
                            </div>
                        ))}
                    </div>
                    {children}
                </>
            )}
            
        </div>
    );
};

export default PlaceListCard;