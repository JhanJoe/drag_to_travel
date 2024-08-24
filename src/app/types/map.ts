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

export interface PlaceList {
    id: string;
    title: string;
    notes: string;
    places?: Place[]; 
}