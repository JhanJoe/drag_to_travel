"use client";

import React, { useState, useEffect, useCallback} from "react";
import { collection, addDoc, getDocs, doc, getDoc, query, where, deleteDoc, updateDoc } from "firebase/firestore";
import { auth, db, onAuthStateChanged } from "../../../firebase-config";
import { useRouter } from "next/navigation";
import PlaceListCard from "../components/PlaceListCard";
import { Place, PlaceList } from '../types/map';
import GoogleMapComponent from "../components/GoogleMapComponent";
import { useAuth } from "../contexts/AuthContext";
import { useTripContext } from "../contexts/TripContext";

const MapPage: React.FC = () => {  
    const { user } = useAuth();
    const { trip, placeLists, fetchTripAndPlaceLists } = useTripContext();
    const [newPlaceListTitle, setNewPlaceListTitle] = useState("");
    const [newPlaceListNotes, setNewPlaceListNotes] = useState("");
    const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null); 
    const [selectedPlace, setSelectedPlace] = useState<any>(null); // 存放選取的景點資訊
    const [infoWindowOpen, setInfoWindowOpen] = useState(false);  //地圖上資訊框的顯示
    const router = useRouter();
    const [tripId, setTripId] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const searchParams = new URLSearchParams(window.location.search);
            const id = searchParams.get("tripId");
            setTripId(id);
        }
    }, []);

    useEffect(() => {
        if (user && tripId) {
            fetchTripAndPlaceLists(user.uid, tripId);
        }
    }, [user, tripId, fetchTripAndPlaceLists]);

    const handleAddPlaceList = async () => {
        if (newPlaceListTitle.trim() !== "" && tripId && user) {
        const newPlaceList = {
            title: newPlaceListTitle,
            notes: newPlaceListNotes,
            userId: user.uid,
            tripId: tripId,
            
        };
        const docRef = await addDoc(collection(db, "placeLists"), newPlaceList);
        fetchTripAndPlaceLists(user.uid, tripId);
        setNewPlaceListTitle("");
        setNewPlaceListNotes("");
        }
    };

    const handleDeletePlaceList = async (id: string) => {
        if (user && tripId) {
            await deleteDoc(doc(db, "placeLists", id));
            fetchTripAndPlaceLists(user.uid, tripId);
        }
    };

    const handleUpdatePlaceList = async (id: string, updatedTitle: string, updatedNotes: string) => {
        if (user && tripId) {
            const placeListDoc = doc(db, "placeLists", id);
            await updateDoc(placeListDoc, {
                title: updatedTitle,
                notes: updatedNotes,
            });
            fetchTripAndPlaceLists(user.uid, tripId);
        }
    };

    const handleAddToPlaceList = async (placeListId: string) => {
        if (selectedPlace && tripId && user) {
            const newPlace: Omit<Place, 'id'> = {
                title: selectedPlace.name,
                address: selectedPlace.formatted_address,
                latitude: selectedPlace.geometry.location.lat(),
                longitude: selectedPlace.geometry.location.lng(),
                note: '',
                userId: user.uid,
                tripId: tripId,
                placeListId: placeListId,
                GoogleMapPlaceId: selectedPlace.place_id,
                rating: selectedPlace.rating || '--',
                userRatingsTotal: selectedPlace.user_ratings_total || '--',
                openingHours: selectedPlace.opening_hours?.weekday_text || '--',
                website: selectedPlace.website || '--',
            };

            try {
                await addDoc(collection(db, "places"), newPlace);
                fetchTripAndPlaceLists(user.uid, tripId);
            } catch (error) {
                console.error("Error adding place:", error);
            }
        }
    };
    
    const handleDeletePlace = useCallback(async (placeId: string) => {
        if (!placeId || typeof placeId !== 'string' || !user || !tripId) {
            console.error("Invalid place ID");
            return;
        }
        try {
            await deleteDoc(doc(db, "places", placeId));
            fetchTripAndPlaceLists(user.uid, tripId);

        } catch (error) {
            console.error("Error deleting place:", error);
        }
    }, [user, tripId, fetchTripAndPlaceLists]);

    const handleStartPlanning = () => {
        if (tripId) {
            router.push(`/planning?tripId=${tripId}`);
        } else {
            console.error("Trip ID is missing!");
        }
    };

    if (!tripId || !user) {
        return <div>Loading...</div>;
    }

    return (
            <div className="flex h-screen">
                <div className="w-1/3 p-4 overflow-y-auto bg-gray-100">
                    {trip && (
                        <div className="mb-2 p-2 border-2 shadow-md bg-white rounded-xl text-center">
                            <div className="text-2xl font-bold">{trip.name}</div>
                            <div>{`${trip.startDate} ~ ${trip.endDate}`}</div>
                            <div className="text-gray-500">{trip.notes}</div>
                        </div>
                    )}
                    <h2 className="text-xl font-bold mb-2 text-center">景點列表</h2>
                    <div className="grid grid-cols-2 gap-2">
                        {placeLists.map((placeList) => (
                            <PlaceListCard
                                key={placeList.id}
                                placeList={placeList}
                                onDelete={handleDeletePlaceList}
                                onUpdate={handleUpdatePlaceList}
                                onDeletePlace={handleDeletePlace}
                            >
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => handleAddToPlaceList(placeList.id)}
                                        className="mt-2 p-1 bg-custom-kame text-gray-600 rounded text-sm active:scale-95 active:shadow-inner"
                                    >
                                        將景點加入此列表
                                    </button>
                                </div>
                            </PlaceListCard>
                        ))}
                        
                    <div className="relative mb-3 p-3 border rounded-xl bg-white overflow-hidden max-h-[250px] flex flex-col">
                        <input
                                type="text"
                                value={newPlaceListTitle}
                                onChange={(e) => setNewPlaceListTitle(e.target.value)}
                                placeholder="新增景點列表標題"
                                className="w-full mb-2 p-2 border rounded"
                            />
                            <textarea
                                value={newPlaceListNotes}
                                onChange={(e) => setNewPlaceListNotes(e.target.value)}
                                placeholder="景點列表的備註"
                                className="w-full mb-2 p-2 border rounded"
                            />
                            <div className="flex justify-center">
                                <button
                                    onClick={handleAddPlaceList}
                                    className="w-[120px] p-1 text-sm bg-custom-kame text-gray-600 rounded active:scale-95 active:shadow-inner"
                                >
                                    新增景點列表
                                </button>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleStartPlanning}
                        className="mt-4 p-2 w-full bg-custom-atomic-tangerine text-white rounded active:scale-95 active:shadow-inner">
                        開始行程規劃！
                    </button>
                    
                </div>

                <div className="w-2/3 relative h-full">
                    <GoogleMapComponent
                            markerPosition={markerPosition}
                            setMarkerPosition={setMarkerPosition}
                            selectedPlace={selectedPlace}
                            setSelectedPlace={setSelectedPlace}
                            infoWindowOpen={infoWindowOpen}
                            setInfoWindowOpen={setInfoWindowOpen}
                            placeLists={placeLists}
                            handleAddToPlaceList={handleAddToPlaceList}
                    />
                    
                </div>
            </div>
        );
    };
    
    export default MapPage;