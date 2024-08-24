'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
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
    updatePlaceLists: (updateFn: (prevPlaceLists: PlaceList[]) => PlaceList[]) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const useTripContext = () => {
    const context = useContext(TripContext);
    if (!context) {
        throw new Error('useTripContext must be used within a TripProvider');
    }
    return context;
};

const CACHE_DURATION = 5 * 60 * 1000; 

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [trip, setTrip] = useState<Trip | null>(null);
    const [placeLists, setPlaceLists] = useState<PlaceList[]>([]);
    const [lastFetchTime, setLastFetchTime] = useState<number>(0);

    type PlacesMap = Map<string, Place[]>;

    const updatePlaceLists = useCallback((updateFn: (prevPlaceLists: PlaceList[]) => PlaceList[]) => {
        setPlaceLists(prevPlaceLists => updateFn(prevPlaceLists));
    }, []);

    const fetchTripAndPlaceLists = useCallback(async (userId: string, tripId: string, forceRefresh = false) => {
        console.log("使用 fetchTripAndPlaceLists 函式", { userId, tripId, forceRefresh }); //TODO 待刪
        
        const now = Date.now();
        if (!forceRefresh && now - lastFetchTime < CACHE_DURATION) {
            console.log("使用TripContext快取資料");  //TODO 待刪
            return; // 使用快取資料
        }

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

        // 然後修改 placesMap 的初始化
        const placesMap: PlacesMap = new Map();
        placesSnapshot.docs.forEach(doc => {
            const place = { id: doc.id, ...doc.data() } as Place;
            if (!placesMap.has(place.placeListId)) {
                placesMap.set(place.placeListId, []);
            }
            const placeList = placesMap.get(place.placeListId);
            if (placeList) {
                placeList.push(place);
            }
        });

        const placeListsList = placeListsSnapshot.docs.map(doc => {
            const data = doc.data() as Omit<PlaceList, 'id'>;
            return { 
                id: doc.id, 
                ...data, 
                places: placesMap.get(doc.id) || [] 
            };
        });

        setPlaceLists(placeListsList);
        setLastFetchTime(now);
    }, [lastFetchTime]); 

    const contextValue = useMemo(() => ({
        trip,
        placeLists,
        fetchTripAndPlaceLists,
        updatePlaceLists  // 給map更新行程和景點列表用的
    }), [trip, placeLists, fetchTripAndPlaceLists, updatePlaceLists]);

    return (
        <TripContext.Provider value={contextValue}>
            {children}
        </TripContext.Provider>
    );
};
