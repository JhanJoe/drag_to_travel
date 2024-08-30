export interface Trip { 
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    notes: string;
    userId: string;
}

export interface PlaceList {
    id: string;
    title: string;
    notes: string;
    places?: Place[]; 
}

export interface Place {
    id: string;
    title: string; //地點資訊
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
    plannedDate?: string;  // 行程日期
    arrivedTime?: string;  // 行程時間
    leftTime?: string;  // 離開時間
    photoUrl?: string;
}

export interface ItineraryPlace {
    id: string;  // 在 itineraries 中的唯一 id
    originalPlaceId: string;  // 該景點在 places 資料庫裡的 firestore id
    title: string;
    address: string;
    latitude: number;
    longitude: number;
    note?: string;
    placeListId: string;
    GoogleMapPlaceId?: string;
    rating?: number;
    userRatingsTotal?: number;
    openingHours?: string[];
    website?: string;
    photoUrl?: string;
    arrivedTime: string | null;
    leftTime: string | null;
    transportDuration?: number;
    transportMode?: 'DRIVING' | 'WALKING' | 'TRANSIT';
}

export interface Itinerary {
    id: string;
    date: string;
    userId: string;
    tripId: string;
    places: ItineraryPlace[];
}