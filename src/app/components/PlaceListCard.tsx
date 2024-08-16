import React, { useState } from "react";
import { FaEdit } from "react-icons/fa";
import { Place, PlaceList } from '../types/map';


interface PlaceListCardProps {
    placeList: PlaceList & { places?: Place[] };
    onDelete: (id: string) => void;
    onUpdate: (id: string, updatedTitle: string, updatedNotes: string) => void;
    onDeletePlace: (placeId: string) => void;
    children?: React.ReactNode;    
}

const PlaceListCard: React.FC<PlaceListCardProps> = ({ placeList, onDelete, onUpdate, onDeletePlace, children }) => {
    console.log("PlaceList in PlaceListCard:", placeList);
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
        <div className="relative mb-3 p-3 border rounded-xl bg-white overflow-hidden max-h-[250px] flex flex-col">
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #c0c0c0;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }
            `}</style>
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
                        className="absolute top-1 right-3 text-2xl text-gray-400"
                    >
                        ×
                    </button>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="absolute top-3 right-8 text-xl text-gray-400"
                    >
                        <FaEdit />
                    </button>

                    <div className="text-lg font-bold text-center">{placeList.title}</div>
                    <div className="text-center text-gray-400 text-sm">{placeList.notes}</div>
                    <div className="mt-2 overflow-y-auto flex-grow custom-scrollbar">
                    {placeList.places?.map((place) => {
                    console.log("Place in map function:", place); //TODO
                    return (
                        <div key={place.id} className="flex items-center justify-between text-center text-gray-600">
                            <div>{place.title}</div>
                            <button
                                onClick={() => {
                                    console.log("Deleting place:", place);  //TODO
                                    if (place.id) {
                                        onDeletePlace(place.id); //TODO
                                    } else {
                                        console.error("Place id is undefined:", place);
                                    }
                                }}
                                className="text-red-500"
                            >
                                ×
                            </button>
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