"use client";

import React, { useState, useEffect } from "react";
import { useTripContext } from "../contexts/TripContext";
import { useRouter } from "next/navigation";
import PlaceListCard from "../components/PlaceListCard";

const PlanPage: React.FC = () => {  
    const { trip, placeLists, fetchTripAndPlaceLists } = useTripContext();
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
        if (tripId) {
            const userId = "currentUserId";
            fetchTripAndPlaceLists(userId, tripId);
        }
    }, [tripId, fetchTripAndPlaceLists]);

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

    const handleBackToMap = () => {
        if (tripId) {
            router.push(`/map?tripId=${tripId}`);
        } else {
            console.error("Trip ID is missing!");
        }
    };

    if (!tripId) {
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
                            onDelete={() => {}}
                            onUpdate={() => {}}
                            onDeletePlace={() => {}}
                        />
                    ))}
                </div>

                <button 
                        onClick={handleBackToMap}
                        className="mt-4 p-2 w-full bg-custom-atomic-tangerine text-white rounded active:scale-95 active:shadow-inner">
                        回到地圖頁面
                    </button>
            </div>

            <div className="w-2/3 relative h-full flex flex-col">
                {/* 右上半部：景點列表 */}
                <div className="flex-1 overflow-x-auto whitespace-nowrap">
                    
                </div>
                {/* 右下半部：行程規劃 */}
                <div className="flex-2 overflow-x-auto whitespace-nowrap">
                    
                </div>
            </div>
        </div>
    );
};

export default PlanPage;
