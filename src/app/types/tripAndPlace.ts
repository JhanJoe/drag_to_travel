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
    plannedDateOrder?: number | null;  // 行程日期內的順序
}

//行程時間
export interface ItineraryWithTime { 
    place: Place;
    time: string; 
}