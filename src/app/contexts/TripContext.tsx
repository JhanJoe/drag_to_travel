'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../../../firebase-config';

interface Trip { 
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    notes: string;
}

interface PlaceList {
    id: string;
    title: string;
    notes: string;
    places?: Place[]; 
}

interface Place {
    id: string;
    title: string;
    address: string;
    latitude: number;
    longitude: number;
    note?: string;
    userId: string;
    tripId: string;
    placeListId: string;
    GoogleMapPlaceId?: string;
    rating?: number;
    userRatingsTotal?: number;
    openingHours?: string[];
    website?: string;
}

interface TripContextType {
    trip: Trip | null;
    placeLists: PlaceList[];
    fetchTripAndPlaceLists: (userId: string, tripId: string) => Promise<void>;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const useTripContext = () => {
    const context = useContext(TripContext);
    if (!context) {
        throw new Error('useTripContext must be used within a TripProvider');
    }
    return context;
};

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [trip, setTrip] = useState<Trip | null>(null);
    const [placeLists, setPlaceLists] = useState<PlaceList[]>([]);

    const fetchTripAndPlaceLists = async (userId: string, tripId: string) => {
        // Fetch trip details
        const tripDoc = doc(db, 'trips', tripId);
        const tripSnapshot = await getDoc(tripDoc);
        if (tripSnapshot.exists()) {
            const tripData = tripSnapshot.data() as Trip;
            setTrip({ ...tripData, id: tripSnapshot.id });
        }

        // Fetch place lists and their associated places
        const placeListsCollection = collection(db, 'placeLists');
        const q = query(placeListsCollection, where('userId', '==', userId), where('tripId', '==', tripId));
        const placeListsSnapshot = await getDocs(q);
        const placeListsList = await Promise.all(
            placeListsSnapshot.docs.map(async (doc) => {
                const data = doc.data() as Omit<PlaceList, 'id'>;
                const placesCollection = collection(db, 'places');
                const placesQuery = query(placesCollection, where('userId', '==', userId), where('tripId', '==', tripId), where('placeListId', '==', doc.id));
                const placesSnapshot = await getDocs(placesQuery);
                const places = placesSnapshot.docs.map((placeDoc) => ({
                    id: placeDoc.id,
                    ...placeDoc.data(),
                } as Place));
                return { id: doc.id, ...data, places };
            })
        );

        setPlaceLists(placeListsList);
    };

    return (
        <TripContext.Provider value={{ trip, placeLists, fetchTripAndPlaceLists }}>
            {children}
        </TripContext.Provider>
    );
};
