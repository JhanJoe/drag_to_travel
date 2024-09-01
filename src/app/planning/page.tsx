"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { useTripContext } from "../contexts/TripContext";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Trip, Place, PlaceList, Itinerary, ItineraryPlace } from '../types/tripAndPlace';
import { useLoading } from "../contexts/LoadingContext";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import GoogleMapComponent from "../components/GoogleMapComponent";
import { FaStar } from "react-icons/fa";
import { db } from "../../../firebase-config";
import { setDoc, updateDoc, doc, getDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { FaRegSave, FaMapMarkedAlt } from "react-icons/fa";
import { TbDragDrop } from "react-icons/tb";
import { MdExpandMore } from "react-icons/md";
import Image from 'next/image';
import { FaArrowsAltV } from "react-icons/fa";


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

const PlanPage: React.FC = () => {  
    const { user, loading } = useAuth();
    const { trip, placeLists, fetchTripAndPlaceLists } = useTripContext();
    const { startLoading, stopLoading } = useLoading(); //loading動畫
    const [isSaving, setIsSaving] = useState(false); //儲存資料的loading動畫
    const [tripId, setTripId] = useState<string | null>(null);
    const [hovered, setHovered] = useState(false); //地圖/規劃切換之hover效果
    const [itineraries, setItineraries] = useState<Record<string, (Place | ItineraryPlace)[]>>({}); //行程
    const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null);
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const [infoWindowOpen, setInfoWindowOpen] = useState<boolean>(false);
    const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
    const [placePhotoUrl, setPlacePhotoUrl] = useState<string | null>(null);
    const [routeInfo, setRouteInfo] = useState<Record<string, Record<string, RouteInfo>>>({}); //路線規劃
    const [selectedMode, setSelectedMode] = useState<TransportMode>('DRIVING'); //交通模式
    const [savedItineraries, setSavedItineraries] = useState<Record<string, (Place | ItineraryPlace)[]>>({});
    const tripDataLoadingRef = useRef(false);
    const router = useRouter();
    const [collapsedListIds, setCollapsedListIds] = useState<string[]>(() => {
        const initialCollapsed = placeLists.slice(1).map(list => list.id); // 除了第一個 placeList 之外，所有的列表初始狀態都設為折疊
        return initialCollapsed;
    });
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); //紀錄是否有未儲存的更改
    const [topDivLarger, setTopDivLarger] = useState(true); // 切換上下佈局比例

    

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const searchParams = new URLSearchParams(window.location.search);
            const id = searchParams.get("tripId");
            setTripId(id);
        }
    }, []);
    
    useEffect(() => {
        const fetchAllData = async () => {
            if (tripId && user && !tripDataLoadingRef.current && !isSaving) {
                tripDataLoadingRef.current = true;
                console.log("PlanPage: 開始載入loading動畫");
                startLoading("正在載入資料...");

                try {
                    await fetchTripAndPlaceLists(user.uid, tripId);

                    const itinerariesRef = collection(db, "itineraries");
                    const q = query(itinerariesRef, where("userId", "==", user.uid), where("tripId", "==", tripId));
                    const querySnapshot = await getDocs(q);
                    
                    const savedData: Record<string, (Place | ItineraryPlace)[]> = {};
                    const routeData: Record<string, Record<string, RouteInfo>> = {};

                    querySnapshot.forEach((doc) => {
                        const data = doc.data() as Itinerary;
                        savedData[data.date] = data.places.map((place: any) => ({
                            ...place,
                            id: place.id || `${place.originalPlaceId}-${Date.now()}`, // 確保每個地點都有唯一的 id
                            latitude: place.latitude,
                            longitude: place.longitude,
                            transportDuration: place.transportDuration || undefined,
                            transportMode: place.transportMode || undefined,
                        }));

                        data.places.forEach((place: any, index: number) => {
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
                    
                    setSavedItineraries(savedData);
                    setRouteInfo(routeData);

                    if (Object.keys(savedData).length > 0) {
                        setItineraries(savedData);
                    }

                } catch (error) {
                    console.error("Error fetching data:", error);
                } finally {
                    console.log("PlanPage: 結束loading動畫");
                    stopLoading();
                    setTimeout(() => {
                        tripDataLoadingRef.current = false;
                    }, 500);
                }
            }
        };

        fetchAllData();
    }, [tripId, user, fetchTripAndPlaceLists, startLoading, stopLoading, isSaving]);    

    
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

    const calculateRoute = async (origin: Place | ItineraryPlace, destination: Place | ItineraryPlace, mode: TransportMode, dateKey: string) => {
        const directionsService = new google.maps.DirectionsService();
        
        const originPosition = { 
            lat: typeof origin.latitude === 'number' ? origin.latitude : parseFloat(origin.latitude), 
            lng: typeof origin.longitude === 'number' ? origin.longitude : parseFloat(origin.longitude)
        };
        const destinationPosition = { 
            lat: typeof destination.latitude === 'number' ? destination.latitude : parseFloat(destination.latitude), 
            lng: typeof destination.longitude === 'number' ? destination.longitude : parseFloat(destination.longitude)
        };

        const convertTo24HourFormat = (time12h: string): string => {
            const [time, modifier] = time12h.split(' ');
            let [hours, minutes] = time.split(':');
        
            if (hours === '12') {
                hours = '00';
            }
        
            if (modifier === 'PM') {
                hours = (parseInt(hours, 10) + 12).toString();
            }
        
            return `${hours}:${minutes}`;
        };

        const date = new Date(dateKey); 

        // 出發時間的優先序（leftTime > arrivedTime > now）
        const departureTime = origin.leftTime 
        ? new Date(`${dateKey}T${convertTo24HourFormat(origin.leftTime)}:00`) 
        : origin.arrivedTime 
        ? new Date(`${dateKey}T${convertTo24HourFormat(origin.arrivedTime)}:00`)
        : new Date();

        console.log('departureTime:', departureTime); //TODO

        const request = {
            origin: new google.maps.LatLng(originPosition.lat, originPosition.lng),
            destination: new google.maps.LatLng(destinationPosition.lat, destinationPosition.lng),
            travelMode: mode as google.maps.TravelMode,
            ...(mode === 'TRANSIT' && {
                transitOptions: {
                    departureTime: new Date(),
                    modes: ['BUS', 'RAIL', 'SUBWAY', 'TRAIN', 'TRAM'] as google.maps.TransitMode[],
                    routingPreference: 'FEWER_TRANSFERS' as google.maps.TransitRoutePreference // 預設選擇較少轉乘的路線
                }
            })
        };

        console.log('request:', request); //TODO

        try {
            const result = await directionsService.route(request);

            if (result && result.routes && result.routes.length > 0) {
                const leg = result.routes[0].legs[0];
                const duration = leg ? leg.duration?.value || 0 : 0;

                if (duration === 0) {
                    setRouteInfo(prevRouteInfo => ({
                        ...prevRouteInfo,
                        [dateKey]: {
                            ...prevRouteInfo[dateKey],
                            [`${origin.id}-${destination.id}`]: { duration: -1, mode }
                        }
                    }));
                    console.log('duration:', duration); //TODO
                } else {
                    setRouteInfo(prevRouteInfo => ({
                        ...prevRouteInfo,
                        [dateKey]: {
                            ...prevRouteInfo[dateKey],
                            [`${origin.id}-${destination.id}`]: { duration: duration / 60, mode }
                        }
                    }));
                    console.log('duration:', duration); //TODO
                }
            } else {
                setRouteInfo(prevRouteInfo => ({
                    ...prevRouteInfo,
                    [dateKey]: {
                        ...prevRouteInfo[dateKey],
                        [`${origin.id}-${destination.id}`]: { duration: -1, mode }
                    }
                }));
            }
        } catch (error) {
            console.error('Error calculating route:', error);
            setRouteInfo(prevRouteInfo => ({
                ...prevRouteInfo,
                [dateKey]: {
                    ...prevRouteInfo[dateKey],
                    [`${origin.id}-${destination.id}`]: { duration: -1, mode }
                }
            }));
        }
    };

    // 交通方式變更
    const handleModeChange = (dateKey: string, fromId: string, toId: string, newMode: TransportMode) => {
        const fromPlace = itineraries[dateKey].find(place => place.id === fromId);
        const toPlace = itineraries[dateKey].find(place => place.id === toId);
        if (fromPlace && toPlace) {
            calculateRoute(fromPlace, toPlace, newMode, dateKey);
        }
    };

    // 輸入時間改變
    const handleTimeChange = (e: ChangeEvent<HTMLInputElement>, dateKey: string, placeId: string, timeType: 'arrivedTime' | 'leftTime') => {
        const newTime = e.target.value;

        // 更新特定日期行程中的特定景點的時間
        setItineraries(prevItineraries => {
            const updatedItineraries = { ...prevItineraries };
            const dayItinerary = updatedItineraries[dateKey].map((place) => 
                place.id === placeId ? {  ...place, [timeType]: newTime } : place
            );
            
            const currentPlace = dayItinerary.find(place => place.id === placeId);

            if (currentPlace) {
                const currentIndex = dayItinerary.indexOf(currentPlace);
                const previousPlace = currentIndex > 0 ? dayItinerary[currentIndex - 1] : undefined;
                const nextPlace = currentIndex < dayItinerary.length - 1 ? dayItinerary[currentIndex + 1] : undefined;
    
                if (timeType === 'leftTime' && previousPlace) {
                    // 如輸入leftTime，重新計算前一個景點到currentPlace的路線
                    calculateRoute(previousPlace, currentPlace, selectedMode, dateKey);
                } else if (timeType === 'arrivedTime' && previousPlace && !currentPlace.leftTime) {
                    // 如輸入arrivedTime但沒有leftTime，重新計算前一個景點到currentPlace的路線
                    calculateRoute(previousPlace, currentPlace, selectedMode, dateKey);
                }
                if (timeType === 'leftTime' && nextPlace) {
                    // 如輸入leftTime，重新計算currentPlace到下一個景點的路線
                    calculateRoute(currentPlace, nextPlace, selectedMode, dateKey);
                }
            }
            setHasUnsavedChanges(true);

            return {
                ...updatedItineraries,
                [dateKey]: dayItinerary,
            };
        });
    };
    
    const onDragEnd = (result: any) => {
        const { source, destination } = result;

        if (!destination) {
            return;
        }

        // 來源列表與目標列表
        let sourceList: (Place | ItineraryPlace)[] | undefined;

        if (source.droppableId in itineraries) {
            sourceList = itineraries[source.droppableId];
        } else {
            const placeList = placeLists.find(pl => pl.id === source.droppableId);
            sourceList = placeList?.places;
        }

        if (!sourceList) {
            console.error("Source list not found.");
            return;
        }

        // 從來源列表中找到被拖曳的item
        const movedItem = sourceList[source.index];

        if (!movedItem) {
            console.error("Moved item not found.");
            return;
        }

        // 目標列表
        let destList: (Place | ItineraryPlace)[] = itineraries[destination.droppableId] || [];

        // 當place的id不包含 "-" 时，才複製一個新的place（=從上方list拉下來的place才需要複製）
        const newPlace = movedItem.id.includes("-")
        ? movedItem // 如果包含"-"，則不複製
        : {
            ...movedItem,
            id: `${movedItem.id}-${Date.now()}`,  // 以-現在時間做後綴生成一個新的ID來作為draggable的ID
            originalPlaceId: movedItem.id,
            title: movedItem.title,
            address: movedItem.address,
            latitude: movedItem.latitude,
            longitude: movedItem.longitude,
            note: movedItem.note || "",
            placeListId: 'placeListId' in movedItem ? movedItem.placeListId : "", 
            GoogleMapPlaceId: movedItem.GoogleMapPlaceId,
            rating: movedItem.rating,
            userRatingsTotal: movedItem.userRatingsTotal,
            openingHours: movedItem.openingHours,
            website: movedItem.website,
            photoUrl: movedItem.photoUrl,
            arrivedTime: null,
            leftTime: null,
            transportDuration: undefined,
            transportMode: undefined
        };

        // 如果複製的新place不等於movedItem，才把新place放入目標列表中，避免重複
        if (newPlace !== movedItem) {
            destList.splice(destination.index, 0, newPlace);
        } else {
            // 如果是已存在的（即 id 包含 "-" 的place），僅移動它在目標列表的位置
            sourceList.splice(source.index, 1); 
            destList.splice(destination.index, 0, movedItem);
        }

        setItineraries({
            ...itineraries,
            [destination.droppableId]: destList,
        });

        // 重新計算相鄰景點之間的路線
        if (destList.length > 1) {
            const index = destination.index;
            if (index > 0) {
                calculateRoute(destList[index - 1], newPlace, 'DRIVING', destination.droppableId);
            }
            if (index < destList.length - 1) {
                calculateRoute(newPlace, destList[index + 1], 'DRIVING', destination.droppableId);
            }
        }

        setHasUnsavedChanges(true);
    };
    
    // 景點點擊
    const handlePlaceClick = (place: Place | ItineraryPlace) => {
        const position = { 
            lat: typeof place.latitude === 'number' ? place.latitude : parseFloat(place.latitude), 
            lng: typeof place.longitude === 'number' ? place.longitude : parseFloat(place.longitude) 
        };

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
            // mapInstance.setZoom(15); 
        }
    };


    // 規劃區塊的行程景點刪除
    const handleRemovePlace = (dateKey: string, placeId: string) => {
        setItineraries(prevItineraries => {
            const updatedItineraries = { ...prevItineraries };
            const dayItinerary = updatedItineraries[dateKey].filter((place) => place.id !== placeId);
            
        const index = updatedItineraries[dateKey].findIndex(place => place.id === placeId);
            if (index > 0 && index < updatedItineraries[dateKey].length - 1) {
                const prevPlace = updatedItineraries[dateKey][index - 1];
                const nextPlace = updatedItineraries[dateKey][index + 1];
                calculateRoute(prevPlace, nextPlace, 'DRIVING', dateKey);
            }

            return {
                ...updatedItineraries,
                [dateKey]: dayItinerary,
            };
        });
    };

    const handleSaveItineraries = async () => {
        if (!user || !tripId) return;
    
        try {
            console.log("開始加載動畫和儲存行程至DB") //TODO
            setIsSaving(true);  // 標記開始儲存的state
            startLoading("儲存中..."); //loading動畫
            
            // 處理undefined的資料->改為null（避免firebase出錯）
            const removeUndefined = (obj: any) => {
                Object.keys(obj).forEach(key => {
                    if (obj[key] === undefined) {
                        // delete obj[key];
                        obj[key] = null;
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        removeUndefined(obj[key]);
                    }
                });
                return obj;
            };

            const itinerariesToSave: Itinerary[] = Object.entries(itineraries).map(([dateKey, places]) => ({
                id: `${user.uid}_${tripId}_${dateKey}`,
                date: dateKey,
                userId: user.uid,
                tripId: tripId,
                share:false,
                public:false,
                places: places.map((place, index) => removeUndefined({
                    id: `${place.id}`,  // 使用 place.id-date.now 作為存進 ItineraryPlace 的 id（例如O4e3SQTNqXIYmrDeRyVM-xxxxxxx）
                    originalPlaceId: place.id.split("-")[0],  // 使用原始的 place.id 作為 originalPlaceId（例如O4e3SQTNqXIYmrDeRyVM）
                    title: place.title,
                    address: place.address,
                    latitude: place.latitude,
                    longitude: place.longitude,
                    note: place.note || null,
                    placeListId: place.placeListId,
                    GoogleMapPlaceId: place.GoogleMapPlaceId,
                    rating: place.rating || null,
                    userRatingsTotal: place.userRatingsTotal || null,
                    openingHours: place.openingHours || null,
                    website: place.website || null,
                    photoUrl: place.photoUrl || null,
                    arrivedTime: place.arrivedTime || null,  
                    leftTime: place.leftTime || null, 
                    transportDuration: index > 0 ? routeInfo[dateKey]?.[`${places[index - 1].id}-${place.id}`]?.duration : undefined,
                    transportMode: index > 0 ? routeInfo[dateKey]?.[`${places[index - 1].id}-${place.id}`]?.mode : undefined,
                })),
            }));

        // 使用 batch 一次儲存多筆資料
        const batch = writeBatch(db);
        itinerariesToSave.forEach((itinerary) => {
            const docRef = doc(db, "itineraries", itinerary.id);
            batch.set(docRef, itinerary);
        });

        await batch.commit();

        setHasUnsavedChanges(false);
        console.log("行程已成功儲存到 Firebase!");
        startLoading("儲存成功!");
        setTimeout(() => {
            stopLoading();
            setIsSaving(false);
        }, 2000);

    } catch (error) {
        console.error("儲存行程時發生錯誤:", error);
        stopLoading();
        setIsSaving(false);
    }
    };

    const toggleCollapse = (listId: string) => {
        setCollapsedListIds((prev) =>
            prev.includes(listId) ? prev.filter((id) => id !== listId) : [...prev, listId]
        );
    };
    
    //判斷列表中的place是否在規劃區塊中
    const isPlaceInItinerary = (place: Place | ItineraryPlace): boolean => {
        const result = Object.values(itineraries).some(dayItinerary =>
            dayItinerary.some(itineraryPlace =>
                itineraryPlace.id.includes(place.id)
            )
        );
    console.log(`Place ${place.id} is in itinerary: `, result); //TODO
    return result;
    };

    // RWD時切換上下區塊比例
    const toggleLayout = () => {
        setTopDivLarger((prev) => !prev);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        router.push('/');
        return null;
    }

    if (!tripId) {
        return <div>No trip selected. Please select a trip first.</div>;
    }

    return (
        <div className="flex h-screen flex-col-reverse lg:flex-row">
            {/* 左半部的區塊 (地圖 & 行程名稱?) */}
            <div className={`w-full lg:w-4/12  order-2 lg:order-1  ${topDivLarger ? "h-[33.33%]" : "h-[10%]"} lg:h-full  overflow-y-auto custom-scrollbar-y bg-gray-100 transition-all duration-500 ease-in-out`}>
                <div className="mt-4 mb-3 mx-3 hidden lg:flex">
                    <div
                        onMouseEnter={() => setHovered(true)}
                        onClick={() => router.push(`/map?tripId=${tripId}`)}
                        className={`w-1/2 text-center px-4 py-2 cursor-pointer transition-colors duration-300 
                        ${hovered ? 'bg-custom-atomic-tangerine text-white' : 'bg-gray-200 text-gray-700'} rounded-l-xl hover:bg-custom-atomic-tangerine hover:text-white`}
                    >
                        地圖頁面
                    </div>
                    <div
                        onMouseEnter={() => setHovered(false)}
                        onClick={() => router.push(`/planning?tripId=${tripId}`)}
                        className={`w-1/2 text-center px-4 py-2 cursor-pointer transition-colors duration-300 
                        ${!hovered ? 'bg-custom-atomic-tangerine text-white' : 'bg-gray-200 text-gray-700'} rounded-r-xl hover:bg-custom-atomic-tangerine hover:text-white`}
                    >
                        規劃頁面
                    </div>
                </div>
                
                {/* RWD時改為地圖icon */}
                <div className="fixed flex flex-col lg:hidden bottom-[140px] right-5 space-y-2 z-10 opacity-80">
                    <button
                        onClick={() => router.push(`/map?tripId=${tripId}`)}
                        className="bg-custom-atomic-tangerine text-white p-3 rounded-full shadow-lg hover:bg-custom-atomic-tangerine hover:opacity-100 active:scale-95 active:shadow-inner"
                    >
                        <FaMapMarkedAlt size={24} />
                    </button>
                    {/* <button
                        onClick={() => router.push(`/planning?tripId=${tripId}`)}
                        className="bg-custom-atomic-tangerine text-white p-3 rounded-full shadow-lg hover:bg-custom-atomic-tangerine hover:opacity-90"
                    >
                        <TbDragDrop size={24} />
                    </button> */}
                </div>

                {trip && (
                    <div className="mx-3 mb-3 p-2 border-2 shadow-md bg-white rounded-xl text-center hidden lg:block">
                        <div className="texl-xl lg:text-2xl font-bold transition-all duration-1000 ease-out">{trip.name}</div>
                        <div className="text-xs lg:text-base">{`${trip.startDate} ~ ${trip.endDate}`}</div>
                        <div className="text-gray-500 text-xs lg:text-base">{trip.notes}</div>
                    </div>
                )}

                <div className="flex-grow h-[500px] lg:h-[calc(100%-8rem)]">
                    <GoogleMapComponent
                        markerPosition={markerPosition}
                        setMarkerPosition={setMarkerPosition}
                        selectedPlace={selectedPlace}
                        setSelectedPlace={setSelectedPlace}
                        infoWindowOpen={infoWindowOpen}
                        setInfoWindowOpen={setInfoWindowOpen}
                        placeLists={placeLists}
                        enableSearch={false} // 在 planning/page 中禁用搜尋功能
                        onMapLoad={(map: google.maps.Map) => setMapInstance(map)}
                        placePhotoUrl={placePhotoUrl}
                        setPlacePhotoUrl={setPlacePhotoUrl}
                    />
                </div>             
            </div>

            <div className={`relative  order-1 lg:order-2  w-full lg:w-8/12  ${topDivLarger ? "h-[66.67%]" : "h-[90%]"} lg:h-full  flex flex-row transition-all duration-500 ease-in-out`}>
                <DragDropContext onDragEnd={onDragEnd}>

                    {/* 景點列表 */}
                    <div className="flex flex-col w-[45%] sm:1/3 lg:w-1/4   h-full  p-4 custom-scrollbar-y overflow-y-auto transition-all duration-1000 ease-out">

                        {trip && (
                            <div className="mb-3 p-2 border-2 shadow-md bg-white rounded-xl text-center block lg:hidden">
                                <div className="texl-xl lg:text-2xl font-bold overflow-hidden transition-all duration-1000 ease-out">{trip.name}</div>
                                <div className="text-xs lg:text-base overflow-hidden">{`${trip.startDate} ~ ${trip.endDate}`}</div>
                                <div className="text-gray-500 text-xs lg:text-base overflow-hidden">{trip.notes}</div>
                            </div>
                        )}

                        <div className="flex flex-col">
                            {placeLists.map((placeList) => (
                                <Droppable droppableId={placeList.id} direction="vertical" key={placeList.id}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="flex-shrink-0 p-2 border rounded-xl bg-white mb-4 h-auto min-w-[100px] w-full overflow-y-auto custom-scrollbar-y"
                                        >
                                            <div className="flex justify-center items-center text-lg font-bold mb-2 text-center cursor-pointer ${placeList.places && placeList.places.length > 0 ? 'text-black' : 'text-gray-400'}`" onClick={() => toggleCollapse(placeList.id)}>
                                                {placeList.title}
                                                <MdExpandMore
                                                    className={`${collapsedListIds.includes(placeList.id) ? 'rotate-0' : 'rotate-180'} transition-transform`}
                                                />
                                            </div>
                                            <div className={`transition-max-height duration-500 ease-in-out overflow-hidden ${collapsedListIds.includes(placeList.id) ? 'max-h-0' : 'max-h-[400px]'}`}>
                                            {!collapsedListIds.includes(placeList.id) && placeList.places?.map((place, index) => (
                                                <Draggable key={place.id} draggableId={place.id} index={index}>
                                                    {(provided) => {
                                                        const isInItinerary = isPlaceInItinerary(place); // 檢查列表中的place是否在行程中

                                                        return (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`p-2 mb-2 border rounded ${isInItinerary ? 'bg-gray-200 text-gray-400' : 'bg-custom-light-cyan cursor-pointer'}`}
                                                            onClick={() => handlePlaceClick(place) }
                                                        >
                                                            <div className="text-sm font-bold truncate" title={place.title}>{place.title}</div>
                                                        </div>
            );
        }}
                                                    
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                        </div>
                                    )}
                                </Droppable>
                            ))}
                        </div>
                    </div>
                
                    {/* 行程規劃 */}
                    <div className="relative  flex flex-col lg:flex-grow  w-[55%] sm:w-2/3 lg:w-3/4 overflow-auto transition-all duration-1000 ease-out">
                        <div className="overflow-x-scroll custom-scrollbar-x whitespace-nowrap mt-4 mb-2 h-full overflow-y-auto custom-scrollbar-y">
                            <div className="flex flex-row align-top h-full ml-4">
                                {tripDateRange.map((date) => {
                                    const dateKey = date.toISOString().split('T')[0];
                                    const tasksForDate = itineraries[dateKey] || [];

                                    return (
                                        <Droppable droppableId={dateKey} key={dateKey}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    className="flex flex-col w-[180px] sm:w-[270px] p-2 mr-4 border rounded-xl bg-white min-h-[1000px] h-fit transition-all duration-1000 ease-out"
                                                >
                                                    <div className="text-center font-bold">
                                                        {date.toLocaleDateString('zh-TW', {
                                                                year: 'numeric',
                                                                month: '2-digit',
                                                                day: '2-digit'
                                                        })}
                                                    </div>
                                                    
                                                    {tasksForDate.length === 0 ? (
                                                        <div className="flex flex-wrap items-start pt-20 justify-center text-gray-400">
                                                            請拖曳列表中景點至此
                                                        </div>
                                                    ) : (
                                                            tasksForDate.map((task, index) => (
                                                                <React.Fragment key={task.id}>
                                                                    {index > 0 && (
                                                                        <div className="p-1 mx-4 sm:mx-10 my-0 border-l-4 border-dotted border-custom-kame bg-white text-sm flex items-center justify-center transition-all duration-1000 ease-out">
                                                                            <select
                                                                                onChange={(e) => handleModeChange(dateKey, tasksForDate[index-1].id, task.id, e.target.value as TransportMode)}
                                                                                value={routeInfo[dateKey]?.[`${tasksForDate[index-1].id}-${task.id}`]?.mode || 'DRIVING'}
                                                                                className="mr-1 p-1 text-sm"
                                                                            >
                                                                                {Object.entries(TRANSPORT_MODE_NAMES).map(([mode, name]) => (
                                                                                    <option key={mode} value={mode}>{name}</option>
                                                                                ))}
                                                                            </select>
                                                                            {routeInfo[dateKey]?.[`${tasksForDate[index-1].id}-${task.id}`]?.duration === -1 ? (
                                                                                <span>暫無資訊</span>
                                                                            ) : routeInfo[dateKey]?.[`${tasksForDate[index-1].id}-${task.id}`] ? (
                                                                                <span>{Math.round(routeInfo[dateKey][`${tasksForDate[index-1].id}-${task.id}`].duration)} 分</span>
                                                                            ) : (
                                                                                '計算中...'
                                                                            )}
                                                                        </div>
                                                                    )}
                                                            <Draggable key={task.id} draggableId={task.id} index={index}>
                                                                {(provided) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        className="flex flex-col sm:flex-row items-start sm:items-center p-2 m-2 border rounded bg-gray-100 cursor-pointer relative overflow-hidden transition-all duration-1000 ease-out"
                                                                            onClick={() => handlePlaceClick(task)}
                                                                    >
                                                                        <div className="w-16 h-16 sm:w-20 sm:h-20 mr-3 flex-shrink-0 relative">
                                                                            <Image 
                                                                                src={task.photoUrl || "/landscape-image.png"} 
                                                                                alt={task.title} 
                                                                                fill
                                                                                style={{ objectFit: 'cover' }}
                                                                                className="rounded"
                                                                            />
                                                                        </div>

                                                                        <div className="flex-grow overflow-hidden">
                                                                        <div className="flex-row items-center">
                                                                            <span className="text-xs">抵達 </span>
                                                                        <input
                                                                            type="time"
                                                                            value={task.arrivedTime || ""}
                                                                            onChange={(e) => handleTimeChange(e, dateKey, task.id, 'arrivedTime')}
                                                                            className="p-0 mb-1 text-xs border rounded"
                                                                        />
                                                                        </div>

                                                                        <button 
                                                                            onClick={(e) => {
                                                                                e.stopPropagation(); // 防止點擊刪除按鈕時觸發其他點擊事件
                                                                                handleRemovePlace(dateKey, task.id);
                                                                            }}
                                                                            className="absolute top-0 right-1 text-custom-atomic-tangerine font-bold text-xs"
                                                                        >
                                                                            x
                                                                        </button>

                                                                        <div className="text-base font-bold truncate" title={task.title}>{task.title}</div>
                                                                        <div className="text-xs text-gray-600 truncate" title={task.address}>{task.address}</div>
                                                                        {/* <div className="text-xs text-gray-400 flex">
                                                                            <FaStar className="text-yellow-500 mr-1" />{task.rating}/5</div> */}

                                                                        <div className="flex-row items-center">
                                                                        <span className="text-xs">離開 </span>
                                                                        <input
                                                                            type="time"
                                                                            value={task.leftTime || ""}
                                                                            onChange={(e) => handleTimeChange(e, dateKey, task.id, 'leftTime')}
                                                                            className="p-0 mt-1 border text-xs rounded"
                                                                        />
                                                                        </div>
                                                                    
                                                                    </div>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                            </React.Fragment>
                                                        ))
                                                    )}
                                                    {provided.placeholder}
                                                </div>

                                                
                                            )}
                                        </Droppable>
                                    );
                                })}
                            </div>
                    </div>
                    
                    <button
                            onClick={handleSaveItineraries}
                            className={`z-50 fixed bottom-[80px] right-5 opacity-80 bg-${hasUnsavedChanges ? 'custom-atomic-tangerine' : 'custom-kame'} text-white p-3 rounded-full shadow-lg hover:bg-custom-atomic-tangerine hover:opacity-100 hover:scale-125 transition-colors active:scale-95 active:shadow-inner ${hasUnsavedChanges ? 'animate-bounce' : ''}`}
                        >
                            <div className="relative flex items-center active:scale-95 active:shadow-inner">
                                <FaRegSave
                                    className="text-white text-2xl"
                                    title="儲存行程"
                                />
                                <span className="hidden lg:block ml-2">儲存行程</span>
                            </div>

                            {hasUnsavedChanges && (
                                <span className={`absolute top-0 right-0 block h-3 w-3 bg-red-600 rounded-full ${hasUnsavedChanges ? 'animate-ping' : ''}`}></span>
                            )}
                        </button>
                </div>
                </DragDropContext>
            </div>

            {/* 切換上下區塊高度變化按鈕 */}
            <button
                onClick={toggleLayout}
                className={`fixed block lg:hidden bottom-[200px] right-5 bg-custom-atomic-tangerine text-white p-3 rounded-full shadow-lg opacity-80 hover:bg-custom-atomic-tangerine hover:opacity-100 transition-all duration-500 z-30 active:scale-95 active:shadow-inner`}
            >
                <FaArrowsAltV size={24} />
            </button>
    </div>
    );
};

export default PlanPage;
