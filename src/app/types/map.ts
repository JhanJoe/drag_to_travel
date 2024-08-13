export interface Place {
    title: string;
    address: string;
    latitude: number;
    longitude: number;
    note?: string;
}

export interface PlaceList {
    id: string;
    title: string;
    notes: string;
    places?: Place[]; 
}