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
    // time: string; 
    arrivedTime: string; // 到達時間
    leavingTime?: string; // 離開時間（可選）
}

//交通方式與時間
export interface TransportationTime {
    origin: Place; // 起點
    destination: Place; // 終點
    travelMode: 'DRIVING' | 'WALKING' | 'TRANSIT'; // 交通方式
    duration: string; // 交通所需時間
}