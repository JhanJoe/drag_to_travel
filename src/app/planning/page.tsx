"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTripContext } from "../contexts/TripContext";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Trip, Place, PlaceList, ItineraryWithTime } from '../types/tripAndPlace';
import PlaceListCard from "../components/PlaceListCard";
import { useLoading } from "../contexts/LoadingContext";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import GoogleMapComponent from "../components/GoogleMapComponent";


const PlanPage: React.FC = () => {  
    const { user, loading } = useAuth();
    const { trip, placeLists, fetchTripAndPlaceLists } = useTripContext();
    const { startLoading, stopLoading } = useLoading(); //loading動畫
    const router = useRouter();
    const [tripId, setTripId] = useState<string | null>(null);
    const [hovered, setHovered] = useState(false); //地圖/規劃切換之hover效果
    
    const [itineraries, setItineraries] = useState<Record<string, Place[]>>({}); //管理每天日程的狀態
    // const [itineraryTime, setItineraryTime] = useState<Record<string, ItineraryWithTime[]>>({}); //每個行程時間

    const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null);
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const [infoWindowOpen, setInfoWindowOpen] = useState<boolean>(false);

    const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

    const tripDataLoadingRef = useRef(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const searchParams = new URLSearchParams(window.location.search);
            const id = searchParams.get("tripId");
            setTripId(id);
        }
    }, []);

    useEffect(() => {
        if (tripId && user && !tripDataLoadingRef.current) {
            tripDataLoadingRef.current = true;
            console.log("PlanPage: 開始載入loading動畫");
            startLoading("正在載入資料...");
            fetchTripAndPlaceLists(user.uid, tripId)
                .finally(() => {
                    console.log("PlanPage: 結束loading動畫");
                    stopLoading();
                    setTimeout(() => {
                        tripDataLoadingRef.current = false;
                    }, 500);
                });
        }
    }, [tripId, user, fetchTripAndPlaceLists, startLoading, stopLoading]);

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

    const onDragEnd = (result: any) => {
        const { source, destination } = result;

        if (!destination) {
            return;
        }

        // 來源列表與目標列表
        let sourceList: Place[] | undefined;
        let destList: Place[] | undefined;

        if (source.droppableId in itineraries) {
            sourceList = itineraries[source.droppableId];
        } else {
            const placeList = placeLists.find(pl => pl.id === source.droppableId);
            sourceList = placeList?.places;
        }

        if (destination.droppableId in itineraries) {
            destList = itineraries[destination.droppableId];
        } else {
            destList = itineraries[destination.droppableId] = [];
        }

        if (!sourceList || !destList) {
            console.error("Source or destination list not found.");
            return;
        }

        // 從來源列表移除拖曳item
        const [movedItem] = sourceList.splice(source.index, 1);

        if (!movedItem) {
            console.error("Moved item not found.");
            return;
        }

        // 添加到目標列表
        destList.splice(destination.index, 0, movedItem);

        setItineraries({
            ...itineraries,
            [source.droppableId]: sourceList,
            [destination.droppableId]: destList,
        });
    };
    
    // 景點點擊
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
            user_ratings_total: place.userRatingsTotal || 0
        } as any);
        setInfoWindowOpen(true);

        if (mapInstance) {
            mapInstance.panTo(position);
            // mapInstance.setZoom(15); 
        }
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
        <div className="flex h-screen">
            <div className="w-1/3 p-4 h-full overflow-y-auto bg-gray-100">
                <div className="flex mb-3">
                    <div
                        onMouseEnter={() => setHovered(true)}
                        onClick={() => router.push(`/map?tripId=${tripId}`)}
                        className={`w-1/2 text-center px-4 py-2 cursor-pointer transition-colors duration-300 
                        ${hovered ? 'bg-custom-atomic-tangerine text-white' : 'bg-gray-200 text-gray-700'} rounded-l-xl hover:bg-custom-atomic-tangerine hover:text-white`}
                    >
                        地圖
                    </div>
                    <div
                        onMouseEnter={() => setHovered(false)}
                        onClick={() => router.push(`/planning?tripId=${tripId}`)}
                        className={`w-1/2 text-center px-4 py-2 cursor-pointer transition-colors duration-300 
                        ${!hovered ? 'bg-custom-atomic-tangerine text-white' : 'bg-gray-200 text-gray-700'} rounded-r-xl hover:bg-custom-atomic-tangerine hover:text-white`}
                    >
                        規劃
                    </div>
                </div>

                {trip && (
                    <div className="mb-3 p-2 border-2 shadow-md bg-white rounded-xl text-center">
                        <div className="text-2xl font-bold">{trip.name}</div>
                        <div>{`${trip.startDate} ~ ${trip.endDate}`}</div>
                        <div className="text-gray-500">{trip.notes}</div>
                    </div>
                )}

                <div className="flex-grow h-[calc(100%-8rem)]">
                    <GoogleMapComponent
                        markerPosition={markerPosition}
                        setMarkerPosition={setMarkerPosition}
                        selectedPlace={selectedPlace}
                        setSelectedPlace={setSelectedPlace}
                        infoWindowOpen={infoWindowOpen}
                        setInfoWindowOpen={setInfoWindowOpen}
                        placeLists={placeLists}
                        enableSearch={false} // 在 planning/page 中禁用搜尋功能
                        enableMapClick={false} // 在 planning/page 中禁用地圖點擊功能
                        onMapLoad={(map: google.maps.Map) => setMapInstance(map)}
                    />
                </div>             
            </div>

            <div className="w-2/3 relative h-full flex flex-col">
                <DragDropContext onDragEnd={onDragEnd}>
                    {/* 右上半部：景點列表 */}
                    <div className="flex-2 overflow-hidden p-4 basis-2/5 max-h-2/5">
                        <div className="flex overflow-x-scroll custom-scrollbar-x whitespace-nowrap mb-2">
                            {placeLists.map((placeList) => (
                                <Droppable droppableId={placeList.id} direction="vertical" key={placeList.id}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="flex-shrink-0 w-40 mr-4 p-4 border rounded-xl bg-white h-[250px] overflow-y-auto custom-scrollbar-y"
                                        >
                                            <div className="text-lg font-bold mb-2 text-center">{placeList.title}</div>
                                            {placeList.places?.map((place, index) => (
                                                <Draggable key={place.id} draggableId={place.id} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="p-2 mb-2 border rounded bg-gray-200 cursor-pointer"
                                                            onClick={() => handlePlaceClick(place)}
                                                        >
                                                            <div className="text-sm font-bold truncate" title={place.title}>{place.title}</div>
                                                            <div className="text-xs text-gray-400">Rating: {place.rating}</div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            ))}
                        </div>
                    </div>
                
                    {/* 右下半部：行程規劃 */}
                    <div className="relative flex-3 basis-3/5 max-h-3/5 flex-grow overflow-hidden">
                    <div className="overflow-x-scroll custom-scrollbar-x whitespace-nowrap mb-2 overflow-y-auto custom-scrollbar-y">
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
                                                className="flex flex-col w-[200px] p-2 mr-4 border rounded-xl bg-white h-[350px]"
                                            >
                                                <div className="text-center font-bold">
                                                    {date.toLocaleDateString('zh-TW', {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit'
                                                    })}
                                                </div>
                                                
                                                {tasksForDate.length === 0 ? (
                                                    <div className="flex-grow flex items-center justify-center text-gray-400">
                                                        請拖曳列表中景點至此
                                                    </div>
                                                ) : (
                                                    tasksForDate.map((task, index) => (
                                                        <Draggable key={task.id} draggableId={task.id} index={index}>
                                                            {(provided) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className="p-2 m-2 border rounded bg-gray-200 cursor-pointer"
                                                                        onClick={() => handlePlaceClick(task)}
                                                                >
                                                                    <div className="text-sm font-bold truncate" title={task.title}>{task.title}</div>
                                                                    <div className="text-xs text-gray-600 truncate" title={task.address}>{task.address}</div>
                                                                    <div className="text-xs text-gray-400">Rating: {task.rating}</div>
                                                                </div>
                                                            )}
                                                        </Draggable>
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
                </div>
                </DragDropContext>
            </div>
        </div>
    );
};

export default PlanPage;
