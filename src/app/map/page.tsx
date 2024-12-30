"use client";

import React, { useState, useEffect, useCallback, useRef} from "react";
import { collection, addDoc, getDocs, doc, getDoc, query, where, deleteDoc, updateDoc, writeBatch } from "firebase/firestore";
import { auth, db, onAuthStateChanged } from "../../../firebase-config";
import { useRouter } from "next/navigation";
import PlaceListCard from "../components/PlaceListCard";
import { Trip, Place, PlaceList} from '../types/tripAndPlace';
import GoogleMapComponent from "../components/GoogleMapComponent";
import { useAuth } from "../contexts/AuthContext";
import { useTripContext } from "../contexts/TripContext";
import { useLoading } from "../contexts/LoadingContext";
import { TbDragDrop } from "react-icons/tb";
import { FaArrowsAltV } from "react-icons/fa";
import { FaRegQuestionCircle } from "react-icons/fa";
import NotificationModal from "../components/NotificationModal";
import Image from 'next/image';

const MapPage: React.FC = () => {  
    const { user, checkTripPermission } = useAuth();
    const { trip, placeLists, setPlaceLists, fetchTripAndPlaceLists, tripDataLoading, setTrip, updatePlaceLists, addPlaceToList, removePlaceFromList } = useTripContext();
    const { startLoading, stopLoading } = useLoading();  //loading動畫
    const [newPlaceListTitle, setNewPlaceListTitle] = useState("");
    const [newPlaceListNotes, setNewPlaceListNotes] = useState("");
    const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null); 
    const [selectedPlace, setSelectedPlace] = useState<any>(null); // 存放選取的景點資訊
    const [infoWindowOpen, setInfoWindowOpen] = useState(false);  //地圖上資訊框的顯示
    const router = useRouter();
    const [tripId, setTripId] = useState<string | null>(null);
    const [hovered, setHovered] = useState('map'); //地圖/規劃/分享切換之hover效果
    const tripDataLoadingRef = useRef(false); // 使用 useRef 來跟踪 tripDataLoading 狀態
    const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
    const [placePhotoUrl, setPlacePhotoUrl] = useState<string | null>(null);
    const [topDivLarger, setTopDivLarger] = useState(false); // 切換上下佈局比例
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const searchParams = new URLSearchParams(window.location.search);
            const id = searchParams.get("tripId");
            setTripId(id);
        }
    }, []);

    useEffect(() => {
        const checkPermissionAndLoadData = async () => {
            if (user && tripId && !tripDataLoadingRef.current) {
                tripDataLoadingRef.current = true;
                startLoading("正在檢查權限...");
                
                try {
                    const permission = await checkTripPermission(tripId);
                    if (permission) {
                        setHasPermission(true);
                        startLoading("正在載入資料...");
                        setTrip(null);
                        setPlaceLists([]);
                        await fetchTripAndPlaceLists(user.uid, tripId);
                    } else {
                        setHasPermission(false);
                        stopLoading();
                        setTimeout(() => router.push('/'), 1500);
                    }
                } catch (error) {
                    console.error("Error checking permission or loading data:", error);
                    setHasPermission(false);
                    stopLoading();
                    setTimeout(() => router.push('/'), 1500);
                } finally {
                    stopLoading();
                    setTimeout(() => {
                        tripDataLoadingRef.current = false;
                    }, 500);
                }
            }
        };

        checkPermissionAndLoadData();
    }, [user, tripId, router, fetchTripAndPlaceLists, startLoading, stopLoading, setTrip, setPlaceLists, checkTripPermission]);

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
                const batch = writeBatch(db);

                // 首先查詢並刪除 places 中符合 placeListId 的所有 place（清理資料庫空間）
                const placesQuery = query(
                    collection(db, "places"),
                    where("placeListId", "==", id)
                );

                const querySnapshot = await getDocs(placesQuery);

                querySnapshot.forEach((docSnapshot) => {
                    batch.delete(docSnapshot.ref);
                });

                // 批次刪除
                await batch.commit();

                await deleteDoc(doc(db, "placeLists", id));
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
                photoUrl: selectedPlace.photoUrl || '',
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

        // RWD時，地圖center往position上方一點偏移(以讓infowindow顯示完整一點)
        if (window.innerWidth <= 640) {
            setTimeout(() => {
                if (mapInstance) {
                const offset = mapInstance.getDiv().clientHeight * 0.05;  
                mapInstance.panBy(0, -offset);
                }
            }, 300);  
        }
    };

    // RWD時切換上下區塊比例
    const toggleLayout = () => {
        setTopDivLarger((prev) => !prev);
    };

    const helpImages = [
        "/images/map-help-1.png",
        "/images/map-help-2.png",
        "/images/map-help-3.png",
        "/images/map-help-4.png"
    ];

    if (!tripId || !user) {
        return <div className="ml-3 mt-7">Loading...</div>;
    }

    if (hasPermission === null) {
        return <div className="ml-3 mt-7">正在檢查權限...</div>;
    }

    if (hasPermission === false) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">無權限讀取</h1>
                    <p className="text-gray-600">您沒有權限編輯此行程。正在返回首頁...</p>
                </div>
            </div>
        );
    }

    return (
            <div className="flex-col lg:flex-row flex h-screen">

                <div className={`w-full lg:w-1/3 order-2 lg:order-1  ${topDivLarger ? "h-[33.33%]" : "h-[66.67%]"} lg:h-full  p-3 overflow-y-auto custom-scrollbar-y bg-gray-100 transition-all duration-500 ease-in-out`}>
                    <div className="mt-4 mb-3 mx-4 lg:mx-0 hidden flex lg:flex" onMouseLeave={() => setHovered('map')}>
                        <div
                            onMouseEnter={() => setHovered('map')}
                            onClick={() => router.push(`/map?tripId=${tripId}`)}
                            className={`w-1/3 text-center px-4 py-2 cursor-pointer transition-colors duration-300 
                            ${hovered === 'map' ? 'bg-custom-atomic-tangerine text-white' : 'bg-gray-200 text-gray-700'} rounded-l-xl hover:bg-custom-atomic-tangerine hover:text-white`}
                        >
                            搜尋景點
                        </div>
                        <div
                            onMouseEnter={() => setHovered('planning')}
                            onClick={() => router.push(`/planning?tripId=${tripId}`)}
                            className={`w-1/3 text-center px-4 py-2 cursor-pointer transition-colors duration-300 
                            ${hovered === 'planning' ? 'bg-custom-atomic-tangerine text-white' : 'bg-gray-200 text-gray-700'} hover:bg-custom-atomic-tangerine hover:text-white`}
                        >
                            規劃行程
                        </div>
                        <div
                        onMouseEnter={() => setHovered('sharing')}
                        onClick={() => router.push(`/sharing?tripId=${tripId}`)}
                        className={`w-1/3 text-center px-4 py-2 cursor-pointer transition-colors duration-300 
                        ${hovered === 'sharing' ? 'bg-custom-atomic-tangerine text-white' : 'bg-gray-200 text-gray-700'} rounded-r-xl hover:bg-custom-atomic-tangerine hover:text-white`}
                    >
                        分享行程
                    </div>
                    </div>

                    {/* RWD時，換成規劃的icon按鈕 */}
                    <div className="fixed  lg:hidden right-5 bottom-[180px] flex flex-col space-y-2 z-10 opacity-80">
                        <button
                            onClick={() => router.push(`/planning?tripId=${tripId}`)}
                            className="bg-custom-kame text-white p-3 rounded-full shadow-lg active:scale-95 active:shadow-inner"
                        >
                            <TbDragDrop size={24} />
                        </button>
                    </div>

                    <div className="container mx-auto flex flex-col">
                        <div className="order-2 lg:order-1">
                            {trip && (
                                <div className="mx-6 lg:mx-0 mb-2 sm:mb-3 p-2 border-2 shadow-md bg-white rounded-xl text-center">
                                    <div className="texl-xl md:text-2xl font-bold transition-all duration-1000 ease-out">{trip.name}</div>
                                    <div className="text-xs md:text-base">{`${trip.startDate} ~ ${trip.endDate}`}</div>
                                    <div className="text-gray-500 text-xs md:text-base">{trip.notes}</div>
                                </div>
                            )}
                        </div>

                        <div className="order-1 lg:order-2">
                            <h2 className="textl-lg md:text-xl font-bold mb-1 sm:mb-2 text-center">景點暫存清單</h2>
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
                                                將景點加入此清單
                                            </button>
                                        </div>
                                    </PlaceListCard>
                                ))}
                                
                            <div className="relative mb-2 sm:mb-3 p-3 border rounded-xl bg-white overflow-hidden max-h-[250px] flex flex-col">
                                <input
                                        type="text"
                                        value={newPlaceListTitle}
                                        onChange={(e) => setNewPlaceListTitle(e.target.value)}
                                        placeholder="先新增清單存放景點"
                                        className="text-sm sm:text-base w-full mb-2 p-1 border-b-2"
                                    />
                                    <input
                                        type="text"
                                        value={newPlaceListNotes}
                                        onChange={(e) => setNewPlaceListNotes(e.target.value)}
                                        placeholder="清單備註"
                                        className="text-sm w-full mb-2 p-1 border-b-2"
                                    />
                                    <div className="flex justify-center">
                                        <button
                                            onClick={handleAddPlaceList}
                                            className="w-[120px] p-1 text-sm bg-custom-kame text-gray-600 rounded active:scale-95 active:shadow-inner"
                                        >
                                            新增景點暫存清單
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 右半部：地圖 */}
                <div className={`relative w-full lg:w-[66.67%] ${topDivLarger ? "h-[66.67%]" : "h-[33.33%]"} lg:h-full  order-1 lg:order-2 transition-all duration-500 ease-in-out`}>
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

                {/* 切換上下區塊高度變化按鈕 */}
                <button
                    onClick={toggleLayout}
                    className={`fixed block lg:hidden bottom-[120px] right-5 bg-custom-kame text-white p-3 rounded-full shadow-lg opacity-80 transition-all duration-500 z-30 active:scale-95 active:shadow-inner`}
                >
                    <FaArrowsAltV size={24} />
                </button>

                {/* 使用說明按鈕 */}
                <button
                    onClick={() => setIsHelpModalOpen(true)}
                    className={`fixed block w-12 h-12 bottom-[60px] lg:top-[65px] right-5 bg-custom-kame text-white lg:bg-custom-atomic-tangerine p-3 rounded-full shadow-lg opacity-80 transition-all duration-500 z-30 active:scale-95 active:shadow-inner hover:scale-110`}
                >
                    <FaRegQuestionCircle size={24} className="animate-pulse" />
                </button>

                {/* 使用說明 */}
                <NotificationModal
                    isOpen={isHelpModalOpen}
                    onClose={() => setIsHelpModalOpen(false)}
                    message={
                        <div className="grid grid-cols-2 gap-6">
                            {helpImages.map((src, index) => (
                                <div key={index} className="flex flex-col items-center">
                                    <Image 
                                        src={src} 
                                        alt={`使用說明 ${index + 1}`} 
                                        width={200} 
                                        height={200} 
                                        className="object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    }
                />
            </div>
        );
    };
    
    export default MapPage;