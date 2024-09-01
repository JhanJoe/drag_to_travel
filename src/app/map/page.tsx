"use client";

import React, { useState, useEffect, useCallback, useRef} from "react";
import { collection, addDoc, getDocs, doc, getDoc, query, where, deleteDoc, updateDoc } from "firebase/firestore";
import { auth, db, onAuthStateChanged } from "../../../firebase-config";
import { useRouter } from "next/navigation";
import PlaceListCard from "../components/PlaceListCard";
import { Trip, Place, PlaceList} from '../types/tripAndPlace';
import GoogleMapComponent from "../components/GoogleMapComponent";
import { useAuth } from "../contexts/AuthContext";
import { useTripContext } from "../contexts/TripContext";
import { useLoading } from "../contexts/LoadingContext";
import { FaMapMarkedAlt } from "react-icons/fa";
import { TbDragDrop } from "react-icons/tb";

const MapPage: React.FC = () => {  
    const { user } = useAuth();
    const { trip, placeLists, setPlaceLists, fetchTripAndPlaceLists, tripDataLoading, setTrip, updatePlaceLists, addPlaceToList, removePlaceFromList } = useTripContext();
    const { startLoading, stopLoading } = useLoading();  //loading動畫
    const [newPlaceListTitle, setNewPlaceListTitle] = useState("");
    const [newPlaceListNotes, setNewPlaceListNotes] = useState("");
    const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null); 
    const [selectedPlace, setSelectedPlace] = useState<any>(null); // 存放選取的景點資訊
    const [infoWindowOpen, setInfoWindowOpen] = useState(false);  //地圖上資訊框的顯示
    const router = useRouter();
    const [tripId, setTripId] = useState<string | null>(null);
    const [hovered, setHovered] = useState(false); //地圖/規劃切換之hover效果
    const tripDataLoadingRef = useRef(false); // 使用 useRef 來跟踪 tripDataLoading 狀態
    const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
    const [placePhotoUrl, setPlacePhotoUrl] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const searchParams = new URLSearchParams(window.location.search);
            const id = searchParams.get("tripId");
            setTripId(id);
        }
    }, []);

    useEffect(() => {   
        if (user && tripId && !tripDataLoadingRef.current) {
                tripDataLoadingRef.current = true;  // flag。用來追蹤是否已經在進行資料載入，true表示資料加載中，就不會再發起新的fetch
                console.log("map/page 開始載入loading動畫") //TODO 待刪
                startLoading("正在載入資料..."); //loading動畫開始
                setTrip(null);
                setPlaceLists([]);
                fetchTripAndPlaceLists(user.uid, tripId)
                .finally(() => {
                    console.log("map/page 結束loading動畫") //TODO 待刪
                    stopLoading();  // 停止loading動畫
                    setTimeout(() => {
                        tripDataLoadingRef.current = false; // 要改為false，這樣有下次useEffect時才會重新fetch資料。(如果前後都不加ref，loading動畫不會顯示)
                    }, 500);  // 加一個延遲，確保UI狀態更新（不加延遲loading動畫不會停, 還會重複fetch）
                });
        }
    }, [user, tripId, fetchTripAndPlaceLists, startLoading, stopLoading, setTrip, setPlaceLists]);

    const handleAddPlaceList = async () => {
        if (newPlaceListTitle.trim() !== "" && tripId && user) {
            const newPlaceList = {
                title: newPlaceListTitle,
                notes: newPlaceListNotes,
                userId: user.uid,
                tripId: tripId,
            };
            try {
                const docRef = await addDoc(collection(db, "placeLists"), newPlaceList);
                updatePlaceLists(prevPlaceLists => [
                    ...prevPlaceLists,
                    { id: docRef.id, ...newPlaceList, places: [] } 
                ]);
                setNewPlaceListTitle("");
                setNewPlaceListNotes("");
            } catch (error) {
                console.error("Error adding place list:", error);
            }
        }
    };

    const handleDeletePlaceList = async (id: string) => {
        if (user && tripId) {
            try {
                await deleteDoc(doc(db, "placeLists", id));
                // removePlaceFromList(tripId, id);
                updatePlaceLists(prevPlaceLists => 
                    prevPlaceLists.filter(placeList => placeList.id !== id)
                );
            } catch (error) {
                console.error("Error deleting place list:", error);
            }
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
                plannedDate: '', 
                arrivedTime: '', 
                leftTime: '',
                photoUrl: selectedPlace.photos?.[0]?.getUrl() || '',
            };
            
            try {
                const docRef = await addDoc(collection(db, "places"), newPlace);
                const newPlaceWithId = { id: docRef.id, ...newPlace };
                
                addPlaceToList(placeListId, newPlaceWithId);
            } catch (error) {
                console.error("Error adding place:", error);
            }
        }
    };
    
    const handleDeletePlace = useCallback(async (placeId: string, placeListId: string) => {
        if (!placeId || typeof placeId !== 'string' || !user || !tripId) {
            console.error("Invalid place ID");
            return;
        }

        try {
            await deleteDoc(doc(db, "places", placeId)); 
            removePlaceFromList(placeListId, placeId);
        } catch (error) {
            console.error("Error deleting place:", error);
        }
    }, [user, tripId, removePlaceFromList]);

    const handlePlaceClick = (place: Place) => {
        const position = { lat: place.latitude, lng: place.longitude };
        setMarkerPosition(position);
        setSelectedPlace({
            ...place,
            name: place.title,
            geometry: {
                location: {
                    lat: () => place.latitude,
                    lng: () => place.longitude
                }
            },
            formatted_address: place.address,
            opening_hours: place.openingHours ? {
                weekday_text: Array.isArray(place.openingHours) ? place.openingHours : []
            } : undefined,
            user_ratings_total: place.userRatingsTotal || 0,
        } as any);
        setInfoWindowOpen(true);
        setPlacePhotoUrl(place.photoUrl || null);

        if (mapInstance) {
            mapInstance.panTo(position);
            mapInstance.setZoom(15); 
        }
    };

    if (!tripId || !user) {
        return <div>Loading...</div>;
    }

    return (
            <div className="flex-col lg:flex-row flex h-screen">

                <div className="w-full lg:w-1/3 order-2 lg:order-1  h-1/3 lg:h-full  p-3 overflow-y-auto custom-scrollbar-y bg-gray-100">
                    <div className="mt-5 mb-3 mx-6 lg:mx-2 hidden flex lg:flex">
                        <div
                            onMouseEnter={() => setHovered(false)}
                            onClick={() => router.push(`/map?tripId=${tripId}`)}
                            className={`w-1/2 text-center px-4 py-2 cursor-pointer transition-colors duration-300 
                            ${!hovered ? 'bg-custom-atomic-tangerine text-white' : 'bg-gray-200 text-gray-700'} rounded-l-xl hover:bg-custom-atomic-tangerine hover:text-white`}
                        >
                            地圖頁面
                        </div>
                        <div
                            onMouseEnter={() => setHovered(true)}
                            onClick={() => router.push(`/planning?tripId=${tripId}`)}
                            className={`w-1/2 text-center px-4 py-2 cursor-pointer transition-colors duration-300 
                            ${hovered ? 'bg-custom-atomic-tangerine text-white' : 'bg-gray-200 text-gray-700'} rounded-r-xl hover:bg-custom-atomic-tangerine hover:text-white`}
                        >
                            規劃頁面
                        </div>
                    </div>

                    {/* RWD時，換成規劃的icon按鈕 */}
                    <div className="fixed  lg:hidden right-5 top-28 flex flex-col space-y-2 z-10 opacity-80">
                        {/* <button
                            onClick={() => router.push(`/map?tripId=${tripId}`)}
                            className="bg-custom-atomic-tangerine text-white p-3 rounded-full shadow-lg hover:bg-custom-atomic-tangerine hover:opacity-90"
                        >
                            <FaMapMarkedAlt size={24} />
                        </button> */}
                        <button
                            onClick={() => router.push(`/planning?tripId=${tripId}`)}
                            className="bg-custom-atomic-tangerine text-white p-3 rounded-full shadow-lg hover:bg-custom-atomic-tangerine hover:opacity-100"
                        >
                            <TbDragDrop size={24} />
                        </button>
                    </div>

                    {trip && (
                        <div className="mx-6 lg:mx-0 mb-3 p-2 border-2 shadow-md bg-white rounded-xl text-center">
                            <div className="texl-xl md:text-2xl font-bold transition-all duration-1000 ease-out">{trip.name}</div>
                            <div className="text-xs md:text-base">{`${trip.startDate} ~ ${trip.endDate}`}</div>
                            <div className="text-gray-500 text-xs md:text-base">{trip.notes}</div>
                        </div>
                    )}
                    <h2 className="textl-lg md:text-xl font-bold mb-2 text-center">景點列表</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 transition-all duration-1000 ease-out px-6 lg:px-0">
                        {placeLists.map((placeList) => (
                            <PlaceListCard
                                key={placeList.id}
                                placeList={placeList}
                                onDelete={handleDeletePlaceList}
                                onUpdate={handleUpdatePlaceList}
                                onDeletePlace={handleDeletePlace}
                                onPlaceClick={handlePlaceClick}
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
                    
                </div>

                {/* 右半部：地圖 */}
                <div className="relative w-full lg:w-2/3  h-2/3 lg:h-full  order-1 lg:order-2">
                    <GoogleMapComponent
                            markerPosition={markerPosition}
                            setMarkerPosition={setMarkerPosition}
                            selectedPlace={selectedPlace}
                            setSelectedPlace={setSelectedPlace}
                            infoWindowOpen={infoWindowOpen}
                            setInfoWindowOpen={setInfoWindowOpen}
                            placeLists={placeLists}
                            handleAddToPlaceList={handleAddToPlaceList}
                            onMapLoad={(map: google.maps.Map) => setMapInstance(map)}
                            placePhotoUrl={placePhotoUrl}
                            setPlacePhotoUrl={setPlacePhotoUrl}
                    />
                    
                </div>
            </div>
        );
    };
    
    export default MapPage;