import React from "react";
import Link from "next/link";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../../../firebase-config";

interface TripCardProps {
    trip: {
        id: string;
        name: string;
        startDate: string;
        endDate: string;
        notes: string;
    };
    onDelete: (id: string) => void;
    onEdit: (trip: any) => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onDelete, onEdit }) => {
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
        <div className="relative border p-3 text-center rounded-xl bg-custom-kame">
            <button
                onClick={handleDelete}
                className="absolute top-1 right-4 text-2xl "
            >
                ×
            </button>
            <div className="text-2xl font-bold">{trip.name}</div>
            <div className="mt-0.5">{`${trip.startDate} ~ ${trip.endDate}`}</div>
            <div className="mt-0.5">{trip.notes}</div>
            <div className="mt-3 flex justify-center">
                <button
                    onClick={() => onEdit(trip)}
                    className="bg-custom-reseda-green text-white p-2 rounded h-10 mr-3 flex items-center justify-center"
                >
                    編輯行程
                </button>
                <Link href={`/map?tripId=${trip.id}`}>
                    <button className="bg-custom-earth-yellow text-white p-2 rounded h-10 flex items-center justify-center">
                        開始規劃
                    </button>
                </Link>
                
            </div>
        </div>
    );
};

export default TripCard;
