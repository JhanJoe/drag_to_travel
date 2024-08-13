"use client";

import React, { useRef, useState } from "react";
import { GoogleMap, useJsApiLoader, Autocomplete, Marker, InfoWindow } from '@react-google-maps/api';
import { Place, PlaceList } from '../types/map';
import { FaStar } from "react-icons/fa";

interface GoogleMapComponentProps {
    markerPosition: google.maps.LatLngLiteral | null;
    setMarkerPosition: (position: google.maps.LatLngLiteral | null) => void;
    selectedPlace: any;
    setSelectedPlace: (place: any) => void;
    infoWindowOpen: boolean;
    setInfoWindowOpen: (isOpen: boolean) => void;
    placeLists: PlaceList[];
    handleAddToPlaceList: (placeListId: string) => void;
}

const libraries: any = ['places'];

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
    markerPosition, setMarkerPosition,
    selectedPlace, setSelectedPlace,
    infoWindowOpen, setInfoWindowOpen,
    placeLists, handleAddToPlaceList
}) => {
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries,
        language: 'zh-TW', 
    });

    const onLoad = (mapInstance: google.maps.Map) => {
        mapRef.current = mapInstance;
        setPlacesService(new google.maps.places.PlacesService(mapInstance));
        mapInstance.panTo({ lat: 25.0330, lng: 121.5654 });
    };

    const onLoadAutocomplete = (autocompleteInstance: google.maps.places.Autocomplete) => {
        setAutocomplete(autocompleteInstance);
    };

    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();

            if (place.geometry && place.geometry.location) {
                const location = place.geometry.location;
                const position = {
                    lat: location.lat(),
                    lng: location.lng()
                };
                setMarkerPosition(position);
                setSelectedPlace(place); // 設定選取的景點資訊
                setInfoWindowOpen(true); // 顯示資訊框
            
                // 僅在搜索時改變地圖中心點
                if (mapRef.current) {
                    // 使用 setTimeout 確保地圖已經完全加載後再移動
                    setTimeout(() => {
                        mapRef.current?.panTo(position);
                        mapRef.current?.setZoom(14);
                    }, 100);
                }
            } else {
                console.log('沒有相關地點資訊');
            }
        }        
    };

    const handleMapClick = (event: google.maps.MapMouseEvent) => {
        if (event.latLng && placesService) {
            setInfoWindowOpen(false);
            const location = event.latLng.toJSON();
            placesService.nearbySearch(
                {
                    location: location,
                    radius: 50,
                    type: 'point_of_interest'
                },
                (results, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0].place_id) {
                        placesService.getDetails(
                            { placeId: results[0].place_id },
                            (place, detailStatus) => {
                                if (detailStatus === google.maps.places.PlacesServiceStatus.OK && place) {
                                    setSelectedPlace(place);
                                    setMarkerPosition(location);
                                    setInfoWindowOpen(true);
                                }
                            }
                        );
                    }
                }
            );
        }
    };

    return isLoaded ? (
        <>
            <Autocomplete
                onLoad={onLoadAutocomplete}
                onPlaceChanged={onPlaceChanged}
            >
                <input
                    type="text"
                    placeholder="搜尋景點"
                    className="absolute top-4 left-4 z-10 p-2 border rounded w-3/4"
                />
            </Autocomplete>
            <GoogleMap
                onLoad={onLoad}
                mapContainerStyle={{ width: '100%', height: '100%' }}
                zoom={10}
                options={{ mapTypeControl: false }} // 取消地圖/衛星切換功能
                onClick={handleMapClick}
            >
                {markerPosition && (
                    <>
                        <Marker position={markerPosition} />
                        {infoWindowOpen && selectedPlace && (
                            <InfoWindow
                                position={markerPosition}
                                onCloseClick={() => setInfoWindowOpen(false)}
                            >
                                <div className="p-2 rounded">
                                    <h2 className="text-lg font-bold">{selectedPlace.name}</h2>
                                    <div className="flex items-center">
                                        <FaStar className="text-yellow-500 mr-1" />
                                        <p>{selectedPlace.rating ? `評分: ${selectedPlace.rating}/5 (${selectedPlace.user_ratings_total} 評論)` : ''}</p>
                                    </div>
                                    {selectedPlace.opening_hours?.weekday_text && selectedPlace.opening_hours.weekday_text.length > 0 ? (
                                        <>
                                            <p>開放時間：</p>
                                            {selectedPlace.opening_hours?.weekday_text.map((day: string, index: number) => (
                                                <p key={index}>{day}</p>
                                            ))}
                                        </>
                                    ) : (
                                        <p>開放時間：-- </p>
                                    )}
                                    {selectedPlace.website && (
                                        <a href={selectedPlace.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                                            官方網站
                                        </a>
                                    )}
                                    <br />
                                    <select
                                        onChange={(e) => handleAddToPlaceList(e.target.value)}
                                        className="mt-2 p-1 bg-custom-reseda-green text-white rounded"
                                    >
                                        <option value="">選擇列表</option>
                                        {placeLists.map((placeList) => (
                                            <option key={placeList.id} value={placeList.id}>
                                                {placeList.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </InfoWindow>
                        )}
                    </>
                )}
            </GoogleMap>
        </>
    ) : <div>Loading...</div>;
};

export default GoogleMapComponent;
