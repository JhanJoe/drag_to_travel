import React, { useState } from "react";
import { FaEdit } from "react-icons/fa";
import { Place, PlaceList } from '../types/tripAndPlace';


interface PlaceListCardProps {
    placeList: PlaceList & { places?: Place[] };
    onDelete?: (id: string) => void; 
    onUpdate?: (id: string, updatedTitle: string, updatedNotes: string) => void; 
    onDeletePlace?: (placeId: string, placeListId: string) => void; 
    onPlaceClick?: (place: Place) => void;
    children?: React.ReactNode;    
}

const PlaceListCard: React.FC<PlaceListCardProps> = ({ placeList, onDelete, onUpdate, onDeletePlace, onPlaceClick, children }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [updatedTitle, setUpdatedTitle] = useState(placeList.title);
    const [updatedNotes, setUpdatedNotes] = useState(placeList.notes);

    const handleSave = () => {
        if (onUpdate) {
            onUpdate(placeList.id, updatedTitle, updatedNotes);
        }
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (onDelete && confirm("你確定要刪除此行程嗎？")) {
            onDelete(placeList.id);
        }
    };

    return (
        <div className="relative mb-3 p-3 border rounded-xl bg-white overflow-hidden max-h-[250px] flex flex-col">
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
                        className="w-full p-1 bg-custom-atomic-tangerine text-white rounded"
                    >
                        儲存
                    </button>
                </>
            ) : (
                <>
                    {onDelete && (
                        <button
                            onClick={handleDelete}
                            className="absolute top-1 right-3 text-2xl text-gray-400" title="刪除行程"
                        >
                            ×
                        </button>
                    )}

                    {onUpdate && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="absolute top-3 right-9 text-xl text-gray-400" title="編輯行程"
                        >
                            <FaEdit />
                        </button>
                    )}

                    <div className="text-base md:text-lg font-bold text-center">{placeList.title}</div>
                    <div className="text-center text-gray-400 text-sm">{placeList.notes}</div>
                    <div className="mt-2 overflow-y-auto flex-grow custom-scrollbar-y">
                    {placeList.places?.map((place) => {
                    return (
                        <div key={place.id} className="flex items-center justify-between text-center text-gray-600">
                            <div className="truncate cursor-pointer" title={place.title} onClick={() => onPlaceClick && onPlaceClick(place)}>{place.title}</div>
                            {onDeletePlace && (
                                <button
                                    onClick={() => {
                                        if (place.id) {
                                            onDeletePlace(place.id, placeList.id); 
                                        } else {
                                            console.error("Place id is undefined:", place);
                                        }
                                    }}
                                    className="text-custom-atomic-tangerine"
                                    title="刪除此景點"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                            );
                        })}
                    </div>
                    {children}
                    
                </>
            )}
            
        </div>
    );
};

export default PlaceListCard;