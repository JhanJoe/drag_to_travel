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
    const [searchValue, setSearchValue] = useState<string>("");
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
            handlePlaceSelection(place);
        }        
    };

    const handlePlaceSelection = (place: google.maps.places.PlaceResult) => {
        if (place.geometry && place.geometry.location) {
            const location = place.geometry.location;
            const position = {
                lat: location.lat(),
                lng: location.lng()
            };
            setMarkerPosition(position);
            // setSelectedPlace(place);
            setSelectedPlace({
                ...place,
                place_id: place.place_id // Ensure place_id is included
            });
            setInfoWindowOpen(true);
            setSearchValue(place.name || "");
        
            if (mapRef.current) {
                mapRef.current.panTo(position);
                const currentZoom = mapRef.current.getZoom();
                if (currentZoom !== undefined && currentZoom < 15) {
                    mapRef.current.setZoom(15);
                }
            }
        } else {
            console.log('無法獲取地點詳細資訊');
        }
    };

    const isSpecificPlace = (result: google.maps.GeocoderResult) => {
    // 檢查結果是否為具體地點而不僅是地址
    /*point_of_interest: 具名搜尋點。一般來說是當地著名的實體。
    establishment: 機構或場所。通常表示尚未歸類的地點
    premise：具名地點，通常是建築物或具有共同名稱的建築物群
    subpremise：具名地點底下的第一順位實體，通常是具有共同名稱的建築物群中的單一建築物
    landmark 表示附近地點，做為導航輔助參考。*/
        return result.types.some(type => 
            ['point_of_interest', 'establishment', 'premise', 'subpremise', 'landamrk'].includes(type) 
        );
    };


    const handleMapClick = (event: google.maps.MapMouseEvent) => {
        event.stop(); //關閉內建資訊框

        if (event.latLng && placesService) {
            const location = event.latLng.toJSON();
            const geocoder = new google.maps.Geocoder();

            geocoder.geocode({ location: location }, (results, status) => {
                if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                    if (isSpecificPlace(results[0])) {
                        // 如果 geocode 結果看起來是一個具體地點，則直接使用
                        placesService.getDetails(
                            { placeId: results[0].place_id, fields: ['name', 'geometry', 'formatted_address', 'place_id', 'rating', 'user_ratings_total', 'opening_hours', 'website'] },
                            (place, detailStatus) => {
                                if (detailStatus === google.maps.places.PlacesServiceStatus.OK && place) {
                                    handlePlaceSelection(place);
                                } else {
                                    console.log('無法獲取地點詳細資訊');
                                }
                            }
                        );
                    } else {
                        // 如果 geocode 結果不是具體地點，則使用 nearbySearch
                        placesService.nearbySearch(
                            {
                                location: location,
                                radius: 10,
                                type: 'point_of_interest'
                            },
                            (nearbyResults, nearbyStatus) => {
                                if (nearbyStatus === google.maps.places.PlacesServiceStatus.OK && nearbyResults && nearbyResults.length > 0) {
                                    const placeId = nearbyResults[0].place_id;
                                    if (placeId) {  
                                        placesService.getDetails(
                                            { 
                                                placeId: placeId, 
                                                fields: ['name', 'geometry', 'formatted_address', 'place_id', 'rating', 'user_ratings_total', 'opening_hours', 'website'] 
                                            },
                                            (place, detailStatus) => {
                                                if (detailStatus === google.maps.places.PlacesServiceStatus.OK && place) {
                                                    handlePlaceSelection(place);
                                                } else {
                                                    console.log('無法獲取地點詳細資訊');
                                                }
                                            }
                                        );
                                    } else {
                                        console.log('無法獲取有效的 place_id');
                                    }
                                } else {
                                     // 如果 nearbySearch 沒有結果，使用 geocode 結果
                                    const address = results[0].formatted_address;
                                    handlePlaceSelection({
                                        name: address,
                                        formatted_address: address,
                                        geometry: { location: new google.maps.LatLng(location) }
                                    } as google.maps.places.PlaceResult);                                    
                                }
                            }
                        );
                    }
                } else {
                    console.log('無法獲取地點資訊');
                }
            });
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
                    placeholder="輸入景點名稱後，點擊浮現對話框的景點開始搜尋。或也可以直接點擊地圖上景點"
                    className="absolute top-4 left-4 z-10 p-2 border rounded w-3/4"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                />
            </Autocomplete>
            <GoogleMap
                onLoad={onLoad}
                mapContainerStyle={{ width: '100%', height: '100%' }}
                zoom={10}
                options={{ mapTypeControl: false, gestureHandling: 'cooperative', }} // 取消地圖/衛星切換功能
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
                                <div className="p-2 rounded z-30">
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
