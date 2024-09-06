'use client';

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTripContext } from "../contexts/TripContext";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Place, ItineraryPlace, Itinerary, Trip } from '../types/tripAndPlace';
import { useLoading } from "../contexts/LoadingContext";
import { db, doc, updateDoc } from "../../../firebase-config";
import { collection, query, where, getDocs, getDoc, } from "firebase/firestore";
import Image from 'next/image';
import { FaCar } from 'react-icons/fa';
import { BsPersonWalking } from 'react-icons/bs';
import { MdDirectionsTransit } from 'react-icons/md';
import { FaArrowAltCircleLeft } from "react-icons/fa";
import { BiSolidHide } from "react-icons/bi";
import { BiShowAlt} from "react-icons/bi";
import { FaShare } from "react-icons/fa";
import { IoMdCloudDone } from "react-icons/io";

type TransportMode = 'DRIVING' | 'WALKING' | 'TRANSIT';

const TRANSPORT_MODE_NAMES: Record<TransportMode, string> = {
    DRIVING: '開車',
    WALKING: '步行',
    TRANSIT: '大眾運輸'
};

interface RouteInfo {
    duration: number;
    mode: TransportMode;
}

const SharingPage: React.FC = () => {
    const { user, loading, checkTripPermission } = useAuth();
    const { trip, setTrip } = useTripContext();
    const { startLoading, stopLoading } = useLoading();
    const [tripId, setTripId] = useState<string | null>(null);
    const [itineraries, setItineraries] = useState<Record<string, ItineraryPlace[]>>({});
    const [routeInfo, setRouteInfo] = useState<Record<string, Record<string, RouteInfo>>>({});
    const [isOwner, setIsOwner] = useState<boolean>(false);
    const [isShared, setIsShared] = useState(false); //用以協助切換分享按鍵狀態
    const [isLoading, setIsLoading] = useState(true); //用來標記loading狀態，防止過早渲染
    const tripDataLoadingRef = useRef(false);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            if (typeof window !== 'undefined') {
                const searchParams = new URLSearchParams(window.location.search);
                const id = searchParams.get("tripId");

                if (id) {
                    setTripId(id);
                    startLoading("正在載入資料...");

                    try {
                        // 檢查user是否為trip owner
                        if (user) {
                            const ownershipStatus = await checkTripPermission(id);
                            setIsOwner(ownershipStatus);
                        } else {
                            setIsOwner(false);
                        }

                        // 無論是否為owner，都fetch行程
                        await fetchTrip(id);
                        await fetchItineraryData(id);
                    } catch (error) {
                        console.error("Error checking ownership or fetching data:", error);
                    } finally {
                        stopLoading();
                        setIsLoading(false);
                    }
                } else {
                setIsLoading(false);
                }
            }
        };

        fetchData();
    }, [tripId, user, checkTripPermission]);

    const fetchItineraryData = async (tripId: string) => {
        if (!tripDataLoadingRef.current) {
            tripDataLoadingRef.current = true;
            try {
                const itinerariesRef = collection(db, "itineraries");
                const q = query(itinerariesRef, where("tripId", "==", tripId));
                const querySnapshot = await getDocs(q);
                
                const savedData: Record<string, ItineraryPlace[]> = {};
                const routeData: Record<string, Record<string, RouteInfo>> = {};

                querySnapshot.forEach((doc) => {
                    const data = doc.data() as Itinerary;
                    savedData[data.date] = data.places;

                    data.places.forEach((place, index) => {
                        if (index > 0) {
                            const prevPlaceId = data.places[index - 1].id;
                            const key = `${prevPlaceId}-${place.id}`;
                            routeData[data.date] = routeData[data.date] || {};
                            routeData[data.date][key] = {
                                duration: place.transportDuration || -1,
                                mode: place.transportMode || 'DRIVING',
                            };
                        }
                    });
                });

                setItineraries(savedData);
                setRouteInfo(routeData);
            } catch (error) {
                console.error("Error fetching itinerary:", error);
            } finally {
                setTimeout(() => {
                    tripDataLoadingRef.current = false;
                }, 500);
            }
        }
    };

    const generateDateRange = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dateArray = [];
        let currentDate = start;

        while (currentDate <= end) {
            dateArray.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dateArray;
    };

    const tripDateRange = trip ? generateDateRange(trip.startDate, trip.endDate) : [];

    const fetchTrip = async (tripId: string) => {
        if (!tripId) return;
    
        try {
            const tripRef = doc(db, "trips", tripId);
            const tripSnapshot = await getDoc(tripRef);
    
            if (tripSnapshot.exists()) {
                const tripData = tripSnapshot.data() as Trip;
                setTrip(tripData);
            } else {
                console.error("Trip not found");
            }
        } catch (error) {
            console.error("Error fetching trip:", error);
        }
    };

    const handleShare = () => {
        const currentUrl = window.location.href;
        navigator.clipboard.writeText(currentUrl)
            .then(() => {
                setIsShared(true);
                setTimeout(() => setIsShared(false), 5000);
            })
            .catch(err => {
                console.error('無法複製 URL: ', err);
            });
    };

    const handlePublicToggle = async () => {
        if (tripId && user && trip) {
            const newPublicStatus = !trip.public;
            try {
                await updateDoc(doc(db, "trips", tripId), { public: newPublicStatus });
                fetchTrip(tripId);
            } catch (error) {
                console.error("Error updating public status:", error);
            }
        }
    };

    if (loading) {
        return <div className="ml-3 mt-7">Loading...</div>;
    }

    if (!trip && !isLoading) {
        router.push("/");
        return <div className="ml-3 mt-7">該行程不存在，回到首頁...</div>;
    }

    return (
        <div className="flex flex-col h-full mt-2 sm:mt-4">
            {trip && (
                    <div className="mx-3 mb-3 p-4 border-b-2 bg-white flex items-center">
                        <div className="flex-1">
                        {isOwner && (
                            <button
                                onClick={() => router.push(`/planning?tripId=${tripId}`)}
                                className="bg-custom-kame text-gray-600 text-xs sm:text-sm
                                p-2  flex items-center space-x-2
                                rounded-full sm:rounded-xl
                                hover:bg-custom-atomic-tangerine hover:text-white
                                active:scale-95 active:shadow-inner hover:scale-105
                                transition-all duration-500 "
                            >
                                <FaArrowAltCircleLeft className="text-base sm:text-lg" />
                                <span className="block sm:hidden">返回</span>
                                <span className="hidden sm:block">返回規劃行程</span>
                                

                            </button>
                        )}
                        </div>

                    <div className="flex-1 bg-white text-center">
                        <div className="flex flex-row justify-center">
                            <div className="text-xl sm:text-2xl font-bold">{trip.name}</div>
                            <span className="text-gray-400 text-sm">{trip.public ? <BiShowAlt /> : <BiSolidHide />}</span>
                        </div>
                        <div className="text-xs sm:text-base">{`${trip.startDate} ~ ${trip.endDate}`}</div>
                        <div className="text-xs sm:text-base text-gray-500">{trip.notes}</div>
                    </div>

                    <div className="flex-1 flex justify-end">
                        {isOwner && (
                            <div className="flex flex-col space-y-2">
                                <button 
                                    onClick={handleShare}
                                    className={`bg-custom-kame hover:bg-custom-atomic-tangerine text-gray-600   hover:text-white 
                                    ${isShared ? 'bg-custom-atomic-tangerine' : 'bg-custom-kame'}
                                    rounded-full sm:rounded-xl
                                    p-2 flex items-center space-x-2 
                                    text-xs sm:text-sm     
                                    active:scale-95 active:shadow-inner hover:scale-105
                                    transition-all duration-500 ease-out`}>
                                    <span className="block sm:hidden">
                                        {isShared ? '已複製' : '分享'}
                                    </span>
                                    <span className="hidden sm:block">
                                        {isShared ? '已複製連結' : '分享給朋友'}
                                    </span>
                                    <span className="text-base sm:text-lg">
                                        {isShared ? <IoMdCloudDone />: <FaShare />}
                                    </span>
                                    
                                </button>
                                
                                <button
                                    onClick={handlePublicToggle}
                                    className={` 
                                    rounded-full sm:rounded-xl
                                    p-2 flex items-center space-x-2 
                                    text-xs sm:text-sm     
                                    active:scale-95 active:shadow-inner hover:scale-105
                                    transition-all duration-500 ease-out 
                                    ${trip.public ? 'bg-gray-400 text-white hover:bg-gray-400' : 'bg-custom-kame text-gray-600 hover:bg-custom-atomic-tangerine hover:text-white'}`}
                                >
                                    <span className="block sm:hidden">
                                        {trip.public ? '隱藏' : '公開'}
                                    </span>
                                    <span className="hidden sm:block">
                                        {trip.public ? '從首頁隱藏' : '公開至首頁'}
                                    </span>
                                    <span className="text-base sm:text-lg">
                                        {trip.public ? <BiSolidHide /> : <BiShowAlt />}
                                    </span>
                                </button>
                            </div>
                        )}
                        {!isOwner && (
                            <div className="text-gray-400 text-sm sm:text-base">
                                分享者：{trip.userEmail?.split('@')[0]}
                            </div>
                        )}
                    </div>
                    
                </div>
            )}

            <div className="flex flex-row align-top h-full mx-4 overflow-x-scroll custom-scrollbar-x overflow-y-auto custom-scrollbar-y overflow-hidden">
                {tripDateRange.map((date) => {
                    const dateKey = date.toISOString().split('T')[0];
                    const tasksForDate = itineraries[dateKey] || [];

                    return (
                        <div key={dateKey} className="flex flex-col min-w-[330px] sm:min-w-[350px] mb-4 p-4 border rounded-xl overflow-hidden bg-white min-h-[400px] h-fit">
                            <div className="text-center font-bold mb-2 text-base">
                                {date.toLocaleDateString('zh-TW', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    weekday: 'narrow',
                                })}
                            </div>
                            
                            {tasksForDate.length === 0 ? (
                                <div className="text-center text-gray-400">這天還沒有行程</div>
                            ) : (
                                tasksForDate.map((task, index) => (
                                    <React.Fragment key={task.id}>
                                        {index > 0 && (
                                            <div className="flex items-center justify-center text-sm text-gray-500 mb-2 p-1 mx-10 border-l-4 border-dotted border-custom-kame">
                                            <div className="mr-2">
                                                {routeInfo[dateKey]?.[`${tasksForDate[index-1].id}-${task.id}`]?.mode === 'DRIVING' && <FaCar />}
                                                {routeInfo[dateKey]?.[`${tasksForDate[index-1].id}-${task.id}`]?.mode === 'WALKING' && <BsPersonWalking />}
                                                {routeInfo[dateKey]?.[`${tasksForDate[index-1].id}-${task.id}`]?.mode === 'TRANSIT' && <MdDirectionsTransit />}
                                            </div>
                                            <div className="mr-2">
                                                {TRANSPORT_MODE_NAMES[routeInfo[dateKey]?.[`${tasksForDate[index-1].id}-${task.id}`]?.mode || 'DRIVING']}
                                            </div>
                                            <div>
                                                {routeInfo[dateKey]?.[`${tasksForDate[index-1].id}-${task.id}`]?.duration !== -1
                                                    ? `${Math.round(routeInfo[dateKey][`${tasksForDate[index-1].id}-${task.id}`].duration)} 分鐘`
                                                    : '暫無資訊'}
                                            </div>
                                        </div>
                                        )}
                                        <div className="flex flex-row items-start mb-2">
                                            <div className="w-20 h-20 flex-shrink-0 mr-4 relative">
                                                <Image 
                                                    src={task.photoUrl || "/landscape-image.png"} 
                                                    alt={task.title} 
                                                    fill
                                                    style={{ objectFit: 'cover' }}
                                                    className="rounded"
                                                />
                                            </div>
                                            <div className="flex-grow">
                                                <div className="text-xs text-gray-500">{task.arrivedTime} - {task.leftTime}</div>
                                                <div className="text-lg font-bold truncate" title={task.title}>{task.title}</div>
                                                <div className="text-sm text-gray-600 truncate text-wrap" title={task.address}>{task.address}</div>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                ))
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SharingPage;
