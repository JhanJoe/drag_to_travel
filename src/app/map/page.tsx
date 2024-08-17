"use client";

import React, { useState, useEffect, useCallback, Suspense} from "react";
import { collection, addDoc, getDocs, doc, getDoc, query, where, deleteDoc, updateDoc } from "firebase/firestore";
import { auth, db, onAuthStateChanged } from "../../../firebase-config";
import { useRouter } from "next/navigation";
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
    const [tripId, setTripId] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const searchParams = new URLSearchParams(window.location.search);
            const id = searchParams.get("tripId");
            setTripId(id);
        }
    }, []);
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                if (tripId) {
                    fetchTripDetails(tripId);
                    fetchPlaceLists(currentUser.uid, tripId);
                }
            } else {
                router.push("/");
            }
        });

        // 當元件卸載時，清理firebase的監聽函數
        return () => unsubscribe();
    }, [tripId, router]);

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
            const places = placesSnapshot.docs.map(placeDoc => ({
                id: placeDoc.id,  
                ...placeDoc.data()
            } as Place));
            console.log("Fetched places:", places);
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
            const newPlace: Omit<Place, 'id'> = {
                title: selectedPlace.name,
                address: selectedPlace.formatted_address,
                latitude: selectedPlace.geometry.location.lat(),
                longitude: selectedPlace.geometry.location.lng(),
                note: selectedPlace.rating ? `Rating: ${selectedPlace.rating} (${selectedPlace.user_ratings_total} reviews)` : '',
                userId: user.uid,
                tripId: tripId,
                placeListId: placeListId,
            };
    
            try {
                const placeRef = await addDoc(collection(db, "places"), newPlace);
    
                const addedPlace: Place = {
                    ...newPlace,
                    id: placeRef.id,
                };
    
                console.log("Added place:", addedPlace); //TODO 待刪掉

                setPlaceLists(prev => prev.map(placeList =>
                    placeList.id === placeListId
                        ? { ...placeList, places: [...(placeList.places || []), addedPlace] }
                        : placeList
                ));
    
                console.log("Place added successfully with ID:", placeRef.id); //TODO 待刪掉
            } catch (error) {
                console.error("Error adding place:", error);
            }
        }
    };
    
    const handleDeletePlace = useCallback(async (placeId: string) => {
        console.log("Attempting to delete place with ID:", placeId); //TODO 待刪掉
        if (!placeId || typeof placeId !== 'string') {
            console.error("Invalid place ID");
            return;
        }
        try {
            await deleteDoc(doc(db, "places", placeId));
            
            setPlaceLists((prevPlaceLists) => 
                prevPlaceLists.map((placeList) => ({
                    ...placeList,
                    places: placeList.places?.filter((place) => place.id !== placeId) || []
                }))
            );
            
            console.log("Place deleted successfully"); //TODO 待刪掉
        } catch (error) {
            console.error("Error deleting place:", error);
        }
    }, []);

    if (!tripId) {
        return <div>Loading...</div>;
    }

    return (
        <Suspense fallback={<div>Loading...</div>}>
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
                                onDeletePlace={handleDeletePlace}
                            >
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => handleAddToPlaceList(placeList.id)}
                                        className="mt-2 p-1 bg-custom-reseda-green text-white rounded text-sm active:scale-95 active:shadow-inner"
                                    >
                                        將景點加入此列表
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
                            placeholder="請新增景點列表標題，如：札幌"
                            className="w-full mb-2 p-2 border rounded"
                        />
                        <input
                            value={newPlaceListNotes}
                            onChange={(e) => setNewPlaceListNotes(e.target.value)}
                            placeholder="可添加景點列表的備註"
                            className="w-full mb-2 p-2 border rounded"
                        />
                        <button
                            onClick={handleAddPlaceList}
                            className="w-full p-2 bg-custom-reseda-green text-white rounded active:scale-95 active:shadow-inner"
                        >
                            新增景點列表以儲存景點
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
        </Suspense>
        );
    };
    
    export default MapPage;