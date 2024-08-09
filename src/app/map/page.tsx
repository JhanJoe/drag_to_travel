"use client";

import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, doc, getDoc, query, where, deleteDoc, updateDoc } from "firebase/firestore";
import { auth, onAuthStateChanged, db } from "../../../firebase-config";
// import GoogleMapReact from 'google-map-react';
import { useRouter, useSearchParams } from "next/navigation";
import PlaceListCard from "../components/PlaceListCard";

interface PlaceList {
    id: string;
    title: string;
    notes: string;
}

interface Trip {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    notes: string;
}

const MapPage: React.FC = () => {
    const [placeLists, setPlaceLists] = useState<PlaceList[]>([]);
    const [newPlaceListTitle, setNewPlaceListTitle] = useState("");
    const [newPlaceListNotes, setNewPlaceListNotes] = useState("");
    const [user, setUser] = useState<any>(null);
    const [trip, setTrip] = useState<Trip | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const tripId =  searchParams.get("tripId");

    useEffect(() => {
        const isAuthenticated = onAuthStateChanged(auth, (user) => {
        if (user) {
            setUser(user);
            if (tripId) {
                fetchTripDetails(tripId);
                fetchPlaceLists(user.uid, tripId);
            }
        } else {
            router.push("/");
        }
        });

    return () => isAuthenticated();
    }, [router, tripId]);

    const fetchTripDetails = async (tripId: string) => {
        const tripDoc = doc(db, "trips", tripId);
        const tripSnapshot = await getDoc(tripDoc);
        if (tripSnapshot.exists()) {
            const tripData = tripSnapshot.data() as Trip;
            setTrip({ ...tripData, id: tripSnapshot.id });        
        }
    };

    const fetchPlaceLists = async (userId: string, tripId: string) => {
        const placeListsCollection = collection(db, "placeLists");
        const q = query(placeListsCollection, where("userId", "==", userId), where("tripId", "==", tripId));
        const placeListsSnapshot = await getDocs(q);
        const placeListsList = placeListsSnapshot.docs.map(doc => {
            const data = doc.data() as Omit<PlaceList, 'id'>;
            return { id: doc.id, ...data };
        });

        setPlaceLists(placeListsList);
    };

    const handleAddPlaceList = async () => {
        if (newPlaceListTitle.trim() !== "" && tripId) {
        const newPlaceList = {
            title: newPlaceListTitle,
            notes: newPlaceListNotes,
            userId: user.uid,
            tripId: tripId,
        };
        const docRef = await addDoc(collection(db, "placeLists"), newPlaceList);
        setPlaceLists([...placeLists, { id: docRef.id, ...newPlaceList }]);
        setNewPlaceListTitle("");
        setNewPlaceListNotes("");
        }
    };

    const handleDeletePlaceList = async (id: string) => {
        await deleteDoc(doc(db, "placeLists", id));
        setPlaceLists(placeLists.filter(placeList => placeList.id !== id));
    };

    const handleUpdatePlaceList = async (id: string, updatedTitle: string, updatedNotes: string) => {
        const placeListDoc = doc(db, "placeLists", id);
        await updateDoc(placeListDoc, {
            title: updatedTitle,
            notes: updatedNotes,
        });
        setPlaceLists(placeLists.map(placeList => placeList.id === id ? { ...placeList, title: updatedTitle, notes: updatedNotes } : placeList));
    };

    if (!tripId) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex h-screen">
            <div className="w-1/4 p-4 overflow-y-auto bg-gray-100">
                {trip && (
                    <div className="mb-3 p-2 border rounded-xl bg-custom-kame text-center">
                        <div className="text-2xl font-bold">{trip.name}</div>
                        <div>{`${trip.startDate} ~ ${trip.endDate}`}</div>
                        <div>{trip.notes}</div>
                    </div>
                )}
                <h2 className="text-2xl font-bold mb-3 text-center">景點列表</h2>
                {placeLists.map((placeList) => (
                    <PlaceListCard
                            key={placeList.id}
                            placeList={placeList}
                            onDelete={handleDeletePlaceList}
                            onUpdate={handleUpdatePlaceList}
                    />
                ))}
                <div className="mt-3">
                    <input
                        type="text"
                        value={newPlaceListTitle}
                        onChange={(e) => setNewPlaceListTitle(e.target.value)}
                        placeholder="景點列表標題"
                        className="w-full mb-2 p-2 border rounded"
                    />
                    <textarea
                        value={newPlaceListNotes}
                        onChange={(e) => setNewPlaceListNotes(e.target.value)}
                        placeholder="備註"
                        className="w-full mb-2 p-2 border rounded"
                    />
                    <button
                        onClick={handleAddPlaceList}
                        className="w-full p-2 bg-custom-reseda-green text-white rounded"
                    >
                        新增景點列表
                    </button>
                </div>
            </div>
            <div className="w-3/4">
                {/* <GoogleMapReact
                bootstrapURLKeys={{ key: "YOUR_GOOGLE_MAPS_API_KEY" }}
                defaultCenter={{ lat: 25.0330, lng: 121.5654 }}
                defaultZoom={10}
                >
                {/* 地圖上的標記 */}
                {/* </GoogleMapReact> */} 
            </div>
            </div>
        );
    };
    
    export default MapPage;