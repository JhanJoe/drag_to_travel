"use client";

import React, { useState, useEffect } from "react";
import { useTripContext } from "../contexts/TripContext";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import PlaceListCard from "../components/PlaceListCard";

const PlanPage: React.FC = () => {  
    const { user, loading } = useAuth();
    const { trip, placeLists, fetchTripAndPlaceLists } = useTripContext();
    const router = useRouter();
    const [tripId, setTripId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hovered, setHovered] = useState(false); //地圖/規劃切換之hover效果

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const searchParams = new URLSearchParams(window.location.search);
            const id = searchParams.get("tripId");
            setTripId(id);
        }
    }, []);
    
    useEffect(() => {
        if (tripId && user) {
            fetchTripAndPlaceLists(user.uid, tripId);
            setIsLoading(false);
        }
    }, [tripId, user, fetchTripAndPlaceLists]);

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

    if (loading || isLoading) {
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
            <div className="w-1/3 p-4 overflow-y-auto bg-gray-100">
                <div className="flex mb-4">
                    <div
                        onMouseEnter={() => setHovered(true)}
                        onClick={() => router.push(`/map?tripId=${tripId}`)}
                        className={`w-1/2 text-center px-4 py-2 cursor-pointer transition-colors duration-300 
                        ${!hovered ? 'bg-custom-atomic-tangerine text-white' : 'bg-gray-200 text-gray-700'} rounded-l hover:bg-custom-atomic-tangerine hover:text-white`}
                    >
                        地圖
                    </div>
                    <div
                        onMouseEnter={() => setHovered(false)}
                        onClick={() => router.push(`/planning?tripId=${tripId}`)}
                        className={`w-1/2 text-center px-4 py-2 cursor-pointer transition-colors duration-300 
                        ${hovered ? 'bg-custom-atomic-tangerine text-white' : 'bg-gray-200 text-gray-700'} rounded-r hover:bg-custom-atomic-tangerine hover:text-white`}
                    >
                        規劃
                    </div>
                </div>

                {trip && (
                    <div className="mb-2 p-2 border-2 shadow-md bg-white rounded-xl text-center">
                        <div className="text-2xl font-bold">{trip.name}</div>
                        <div>{`${trip.startDate} ~ ${trip.endDate}`}</div>
                        <div className="text-gray-500">{trip.notes}</div>
                    </div>
                )}
                {/* <h2 className="text-xl font-bold mb-2 text-center">景點列表</h2>
                <div className="grid grid-cols-2 gap-2"> */}
                    {/* {placeLists.map((placeList) => (
                        <PlaceListCard
                            key={placeList.id}
                            placeList={placeList}
                            onDelete={() => {}}
                            onUpdate={() => {}}
                            onDeletePlace={() => {}}
                        />
                    ))} */}
                {/* </div> */}

            </div>

            <div className="w-2/3 relative h-full flex flex-col">
                {/* 右上半部：景點列表 */}
                <div className="flex-2 overflow-x-scroll custom-scroll whitespace-nowrap p-4">
                    <div className="flex">
                        {placeLists.map((placeList) => (
                            <div key={placeList.id} className="flex-shrink-0 w-40 mr-4">
                                <PlaceListCard
                                    placeList={placeList}
                                />
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="w-4/5 border mx-auto bg-gray-300 my-2"></div>

                {/* 右下半部：行程規劃 */}
                <div className="flex-3 overflow-x-scroll custom-scroll whitespace-nowrap p-4 ">
                    {tripDateRange.map((date) => (
                        <div key={date.toISOString()} className="inline-block w-64 p-2 mr-4 border rounded-xl bg-white">
                            <div className="text-center font-bold">
                                {date.toLocaleDateString('zh-TW', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit'
                                })}
                            </div>
                            
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .custom-scroll {
                    scrollbar-width: auto; /* For Firefox */
                    -ms-overflow-style: auto; /* For IE */
                }

                .custom-scroll::-webkit-scrollbar {
                    width: 8px; /* Set width of the scrollbar */
                    height: 8px; /* Set height of the scrollbar */
                    background-color: #f1f1f1; /* Background color of the scrollbar */
                }

                .custom-scroll::-webkit-scrollbar-thumb {
                    background-color: #888; /* Color of the scrollbar thumb */
                    border-radius: 10px; /* Optional: round the corners of the scrollbar */
                }

                .custom-scroll:hover::-webkit-scrollbar-thumb {
                    background-color: #555; /* Darken the color when hovered */
                }
            `}</style>

        </div>
    );
};

export default PlanPage;
