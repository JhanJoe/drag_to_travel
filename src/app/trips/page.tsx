"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection,addDoc, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { auth, onAuthStateChanged, db } from "../../../firebase-config";
import TripCard from "../components/TripCard";
import TripModal from "../components/TripModal";
import { useLoading } from "../contexts/LoadingContext";
import { useAuth } from "../contexts/AuthContext";
import { Trip } from '../types/tripAndPlace'; 

const TripsPage: React.FC = () => {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
    const router = useRouter();
    const { user, loading } = useAuth();
    const { startLoading, stopLoading } = useLoading();
    const hasFetchedRef = useRef(false); //使用 useRef 來追蹤是否已經執行過 fetch

    const fetchTrips = useCallback(async (userId: string) => {
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;

        try {
            console.log("執行fetchtrip函式"); //TODO 待刪

            const tripsCollection = collection(db, "trips");
            const q = query(tripsCollection, where("userId", "==", userId));
            const tripsSnapshot = await getDocs(q);
            let tripsList = tripsSnapshot.docs.map(doc => {
                const data = doc.data() as Omit<Trip, 'id'>;
                return { id: doc.id, ...data };
            });

            tripsList = tripsList.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

            setTrips(tripsList);
        } catch (error) {
            console.error("Error fetching trips:", error);
        } finally {             
            console.log("trippage-執行完fetchtrip, 結束loading動畫") //TODO 待刪
            stopLoading();
        }
    }, [stopLoading]);

    useEffect(() => {        
        const isLoadingFromLogin = localStorage.getItem('isLoading') === 'true';
            if (isLoadingFromLogin) {
                console.log("開始執行trippage-startloading");  //TODO 待刪
                startLoading("載入行程資料中...");

                console.log("trippage-移除localstorage中的isLoading");  //TODO 待刪
                localStorage.removeItem('isLoading');
            }

            if (!loading && user) {
                fetchTrips(user.uid);
            } else if (!loading && !user) {
                stopLoading();
                router.push("/");
            }

        return () => {
            console.log("trippage-移除localstorage中的isLoading");  //TODO 待刪
            localStorage.removeItem('isLoading');
        };
    }, [user, loading, router, fetchTrips, startLoading, stopLoading]);    

    const handleAddTrip = async (trip: any) => {
        const docRef = await addDoc(collection(db, "trips"), trip);
        setTrips(prevTrips => {
            const newTrips = [{ id: docRef.id, ...trip }, ...prevTrips];
            return newTrips.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        });
    };

    const handleDeleteTrip = (id: string) => {
        setTrips(prevTrips => prevTrips.filter(trip => trip.id !== id));
    };

    const handleEditTrip = (trip: Trip) => {
        setCurrentTrip(trip);
        setShowModal(true);
    };

    const handleSaveTrip = async (trip: Trip) => {
        if (!user) {
            console.error("尚未登入");
            return;
        }

        if (trip.id) {
            // 更新已經有的行程
            const tripRef = doc(db, "trips", trip.id);
            const updatedTrip = {
                name: trip.name,
                startDate: trip.startDate,
                endDate: trip.endDate,
                notes: trip.notes,
                userId: user.uid,
            };
            await updateDoc(tripRef, updatedTrip);
            setTrips((prevTrips) => {
                const updatedTrips = prevTrips.map((t) => (t.id === trip.id ? trip : t));
                return updatedTrips.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
            });
            } else {
                // 新增行程
                const newTrip = { ...trip, userId: user.uid };
                await handleAddTrip(newTrip);
            }
            setShowModal(false);
    };

    return (
        <div className="p-4">
            <div
                className="border-2 shadow-md p-4 mb-4 cursor-pointer text-center rounded-md text-gray-400 hover:text-custom-atomic-tangerine "
                onClick={() => {
                setCurrentTrip(null);
                setShowModal(true);
                }}
            >
                <div className="text-center text-4xl">+</div>
                <div className="text-center">請新增行程來開始後續規劃</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trips.map(trip => (
                <TripCard key={trip.id} trip={trip} onDelete={handleDeleteTrip} onEdit={handleEditTrip} />
                ))}
            </div>
            {showModal && (
                <TripModal
                onClose={() => setShowModal(false)}
                onSave={handleSaveTrip}
                trip={currentTrip}
                />
            )}
        </div>
    );
};

export default TripsPage;