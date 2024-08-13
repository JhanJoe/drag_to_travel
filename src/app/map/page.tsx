"use client";

import React, { useState, useEffect} from "react";
import { collection, addDoc, getDocs, doc, getDoc, query, where, deleteDoc, updateDoc } from "firebase/firestore";
import { auth, onAuthStateChanged, db } from "../../../firebase-config";
import { useRouter, useSearchParams } from "next/navigation";
import PlaceListCard from "../components/PlaceListCard";
import { Place, PlaceList } from '../types/map';
import GoogleMapComponent from "../components/GoogleMapComponent";

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
    const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null);
    const [selectedPlace, setSelectedPlace] = useState<any>(null); // 存放選取的景點資訊
    const [infoWindowOpen, setInfoWindowOpen] = useState(false);  //地圖上資訊框的顯示
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
        const placeListsList = await Promise.all(placeListsSnapshot.docs.map(async (doc) => {
            const data = doc.data() as Omit<PlaceList, 'id'>;
            const placesCollection = collection(db, "places");
            const placesQuery = query(placesCollection, where("userId", "==", userId), where("tripId", "==", tripId), where("placeListId", "==", doc.id));
            const placesSnapshot = await getDocs(placesQuery);
            const places = placesSnapshot.docs.map(placeDoc => placeDoc.data() as Place);
            return { id: doc.id, ...data, places };
        }));

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

    const handleAddToPlaceList = async (placeListId: string) => {
        if (selectedPlace && tripId) {
            const newPlace = {
                title: selectedPlace.name,
                address: selectedPlace.formatted_address,
                latitude: selectedPlace.geometry.location.lat(),
                longitude: selectedPlace.geometry.location.lng(),
                tripId: tripId,
                userId: user.uid,
                placeListId: placeListId,
                note: selectedPlace.rating ? `Rating: ${selectedPlace.rating} (${selectedPlace.user_ratings_total} reviews)` : '',
            };

            await addDoc(collection(db, "places"), newPlace);

            setPlaceLists(prev => prev.map(placeList => 
                placeList.id === placeListId 
                    ? { ...placeList, places: [...(placeList.places || []), newPlace] }
                    : placeList
            ));
        }
    };

    if (!tripId) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex h-screen">
            <div className="w-1/3 p-4 overflow-y-auto bg-gray-100">
                {trip && (
                    <div className="mb-2 p-2 border rounded-xl bg-custom-kame text-center">
                        <div className="text-2xl font-bold">{trip.name}</div>
                        <div>{`${trip.startDate} ~ ${trip.endDate}`}</div>
                        <div>{trip.notes}</div>
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
                        >
                            <div className="flex justify-center">
                                <button
                                    onClick={() => handleAddToPlaceList(placeList.id)}
                                    className="mt-2 p-1 bg-custom-reseda-green text-white rounded"
                                >
                                    加入此列表
                                </button>
                            </div>
                        </PlaceListCard>
                    ))}
                </div>
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