'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../../../firebase-config';
import { Trip, Place, PlaceList, ItineraryWithTime } from '../types/tripAndPlace'; 

interface TripContextType {
    trip: Trip | null;
    placeLists: PlaceList[];
    fetchTripAndPlaceLists: (userId: string, tripId: string) => Promise<void>;
    updatePlaceLists: (updateFn: (prevPlaceLists: PlaceList[]) => PlaceList[]) => void;
    addPlaceToList: (placeListId: string, newPlace: Place) => void;
    removePlaceFromList: (placeListId: string, placeId: string) => void;
    setPlaceLists: (newPlaceLists: PlaceList[]) => void; 
    setTrip: (newTrip: Trip | null) => void; 
    tripDataLoading: boolean;
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
    const [tripDataLoading, setTripDataLoading] = useState<boolean>(false);
    const tripDataLoadingRef = useRef(false);

    type PlacesMap = Map<string, Place[]>;

    const updatePlaceLists = useCallback((updateFn: (prevPlaceLists: PlaceList[]) => PlaceList[]) => {
        setPlaceLists(prevPlaceLists => updateFn(prevPlaceLists));
    }, []);

    const addPlaceToList = useCallback((placeListId: string, newPlace: Place) => {
        setPlaceLists(prevPlaceLists => 
            prevPlaceLists.map(placeList => 
                placeList.id === placeListId
                ? { ...placeList, places: [...(placeList.places || []), newPlace] }
                : placeList
            )
        );
    }, []);
    
    const removePlaceFromList = useCallback((placeListId: string, placeId: string) => {
        setPlaceLists(prevPlaceLists => 
            prevPlaceLists.map(placeList => 
            placeList.id === placeListId
                ? { ...placeList, places: placeList.places?.filter(place => place.id !== placeId) }
                : placeList
            )
        );
    }, []);

    const fetchTripAndPlaceLists = useCallback(async (userId: string, tripId: string) => {
        console.log("使用 fetchTripAndPlaceLists 函式", { userId, tripId }); //TODO 待刪

        if (tripDataLoadingRef.current) {
            console.log("TripContext- Already loading, skipping fetch");
            return;
        }

        tripDataLoadingRef.current = true;
        setTripDataLoading(true);

        try {
        // fetch 行程
        const tripDoc = doc(db, 'trips', tripId);
        const tripSnapshot = await getDoc(tripDoc);
        if (tripSnapshot.exists()) {
            const tripData = tripSnapshot.data() as Trip;
            setTrip({ ...tripData, id: tripSnapshot.id });
        }

        // fetch 景點列表和景點
        const placeListsCollection = collection(db, 'placeLists');
        const q = query(placeListsCollection, where('userId', '==', userId), where('tripId', '==', tripId));
        const placeListsSnapshot = await getDocs(q);
        
        const placesCollection = collection(db, 'places');
        const placesQuery = query(placesCollection, where('userId', '==', userId), where('tripId', '==', tripId));
        const placesSnapshot = await getDocs(placesQuery);

        // 修改 placesMap 的初始化
        const placesMap: PlacesMap = new Map();
        placesSnapshot.docs.forEach(doc => {
            const place = { id: doc.id, ...doc.data() } as Place;
            if (!placesMap.has(place.placeListId)) {
                placesMap.set(place.placeListId, []);
            }
            placesMap.get(place.placeListId)?.push(place);
        });

        const placeListsList = placeListsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            places: placesMap.get(doc.id) || []
        } as PlaceList));

        setPlaceLists(placeListsList);
    } catch (error) {
        console.error("Error fetching trip and place lists:", error);
    } finally {
        tripDataLoadingRef.current = false;
        setTripDataLoading(false);
    }
    }, []); 

    const contextValue = useMemo(() => ({
        trip,
        placeLists,
        fetchTripAndPlaceLists,
        tripDataLoading,
        updatePlaceLists,  
        addPlaceToList,
        removePlaceFromList,
        setPlaceLists, 
        setTrip,
    }), [trip, placeLists, fetchTripAndPlaceLists, tripDataLoading, updatePlaceLists, addPlaceToList, removePlaceFromList]);

    return (
        <TripContext.Provider value={contextValue}>
            {children}
        </TripContext.Provider>
    );
};
