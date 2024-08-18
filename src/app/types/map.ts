export interface Place {
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

export interface PlaceList {
    id: string;
    title: string;
    notes: string;
    places?: Place[]; 
}