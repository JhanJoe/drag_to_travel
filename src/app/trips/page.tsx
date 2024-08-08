"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection,addDoc, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { auth, onAuthStateChanged, db } from "../../../firebase-config";
import TripCard from "../components/TripCard";
import TripModal from "../components/TripModal";

interface Trip {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    notes: string;
    userId: string;
}

const TripsPage: React.FC = () => {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
                fetchTrips(user.uid);
            } else {
                router.push("/");
            }
        });

        return () => unsubscribe();
    }, [router]);

    const fetchTrips = async (userId: string) => {
        const tripsCollection = collection(db, "trips");
        const q = query(tripsCollection, where("userId", "==", userId));
        const tripsSnapshot = await getDocs(q);
        let tripsList = tripsSnapshot.docs.map(doc => {
            const data = doc.data() as Omit<Trip, 'id'>;
            return { id: doc.id, ...data };
        });

        tripsList = tripsList.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

        setTrips(tripsList);
    };

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
                className="border p-4 mb-4 cursor-pointer text-center rounded-md "
                onClick={() => {
                setCurrentTrip(null);
                setShowModal(true);
                }}
            >
                <div className="text-center text-4xl">+</div>
                <div className="text-center">新增行程</div>
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