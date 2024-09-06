import React from "react";
import Link from "next/link";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase-config";
import { BiSolidHide } from "react-icons/bi";
import { BiShowAlt} from "react-icons/bi";

interface TripCardProps {
    trip: {
        id: string;
        name: string;
        startDate: string;
        endDate: string;
        notes: string;
        public: boolean;
    };
    onDelete: (id: string) => void;
    onEdit: (trip: any) => void;
    onTogglePublic: (tripId: string, currentPublicStatus: boolean) => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onDelete, onEdit, onTogglePublic }) => {
    const handleDelete = async () => {
        if (confirm("你確定要刪除這個行程嗎？")) {
            try {
                await deleteDoc(doc(db, "trips", trip.id));
                onDelete(trip.id);
            } catch (error) {
                console.error("Error deleting trip: ", error);
            }
        }
    };

    return (
        <div className="relative border-2 p-3 text-center rounded-xl shadow-md">
            <button
                onClick={handleDelete}
                className="absolute top-1 right-4 text-2xl "
            >
                ×
            </button>
            <div className="flex flex-row justify-center">
                <div className="text-2xl font-bold">{trip.name}</div>
                <span 
                    className="text-gray-400 text-lg cursor-pointer hover:text-custom-atomic-tangerine transition-all duration-300 z-30 active:scale-95 active:shadow-inner hover:scale-110" 
                    onClick={() => onTogglePublic(trip.id, trip.public)}
                    title={trip.public ? "將行程改為不公開" : "公開分享行程"}
                >
                    {trip.public ? <BiShowAlt /> : <BiSolidHide />}
                </span>
            </div>
            <div className="mt-0.5">{`${trip.startDate} ~ ${trip.endDate}`}</div>
            <div className="mt-0.5 text-gray-500">{trip.notes}</div>
            <div className="mt-3 flex justify-center">
                <button
                    onClick={() => onEdit(trip)}
                    className="bg-custom-kame text-gray-600 p-2 rounded h-10 mr-3 flex items-center justify-center active:scale-95 active:shadow-inner transition-all duration-300 ease-on-out hover:scale-110 transform"
                >
                    修改資訊
                </button>
                <Link href={`/map?tripId=${trip.id}`}>
                    <button className="bg-custom-atomic-tangerine text-white p-2 rounded h-10 flex items-center justify-center active:scale-95 active:shadow-inner transition-all duration-300 ease-on-out hover:scale-110 transform">
                        開始規劃
                    </button>
                </Link>
                
            </div>
        </div>
    );
};

export default TripCard;
