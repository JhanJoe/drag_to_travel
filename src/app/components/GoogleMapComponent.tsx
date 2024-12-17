"use client";

import React, { useRef, useState } from "react";
import { GoogleMap, useJsApiLoader, Autocomplete, Marker, InfoWindow } from '@react-google-maps/api';
import { Place, PlaceList } from '../types/tripAndPlace';
import { FaStar } from "react-icons/fa";
import Image from 'next/image';

interface GoogleMapComponentProps {
    markerPosition: google.maps.LatLngLiteral | null;
    setMarkerPosition: (position: google.maps.LatLngLiteral | null) => void;
    selectedPlace: any;
    setSelectedPlace: (place: any) => void;
    infoWindowOpen: boolean;
    setInfoWindowOpen: (isOpen: boolean) => void;
    placeLists: PlaceList[];
    handleAddToPlaceList?: (placeListId: string) => void; //planning頁面不需要
    enableSearch?: boolean; // 搜尋功能（planning不使用）
    onMapLoad?: (map: google.maps.Map) => void;
    placePhotoUrl: string | null;
    setPlacePhotoUrl: (url: string | null) => void;
}

const libraries: any = ['places'];

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
    markerPosition, setMarkerPosition,
    selectedPlace, setSelectedPlace,
    infoWindowOpen, setInfoWindowOpen,
    placeLists, handleAddToPlaceList,
    enableSearch = true, 
    onMapLoad,
    placePhotoUrl,
    setPlacePhotoUrl,
}) => {
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedPlaceListId, setSelectedPlaceListId] = useState<string>(""); //下拉式選單狀態
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
        if (onMapLoad) {
            onMapLoad(mapInstance); 
        }
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
        setPlacePhotoUrl(null);

        if (place.geometry && place.geometry.location) {
            const location = place.geometry.location;
            const position = {
                lat: location.lat(),
                lng: location.lng()
            };
            setMarkerPosition(position);
            setSelectedPlace({
                ...place,
                place_id: place.place_id 
            });
            setInfoWindowOpen(true);
            setSearchValue(place.name || "");
        
            setSelectedPlaceListId("");

            if (mapRef.current) {
                mapRef.current.panTo(position);
                const currentZoom = mapRef.current.getZoom();
                if (currentZoom !== undefined && currentZoom < 15) {
                    mapRef.current.setZoom(15);
                }
            }

            if (place.photos && place.photos.length > 0) {
                const photoUrl = place.photos[0].getUrl({ maxWidth: 300, maxHeight: 200 });
                setPlacePhotoUrl(photoUrl);
            } else {
                setPlacePhotoUrl(null); 
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
                            { placeId: results[0].place_id, fields: ['name', 'geometry', 'formatted_address', 'place_id', 'rating', 'user_ratings_total', 'opening_hours', 'website', 'photos'] },
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
                                                fields: ['name', 'geometry', 'formatted_address', 'place_id', 'rating', 'user_ratings_total', 'opening_hours', 'website', 'photos'] 
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
            {enableSearch && (
                <Autocomplete
                    onLoad={onLoadAutocomplete}
                    onPlaceChanged={onPlaceChanged}
                >
                    <input
                        type="text"
                        placeholder="輸入名稱，開始搜尋景點"
                        className="fixed  text-sm sm:text-base top-[50px] sm:top-[66px] left-[3%] lg:left-[35%] z-10 p-1 lg:p-2 border rounded w-[40%] min-w-[230px] "
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                    />
                </Autocomplete>
            )}
            <GoogleMap
                onLoad={onLoad}
                mapContainerStyle={{ width: '100%', height: '100%' }}
                zoom={10}
                options={{ mapTypeControl: false, gestureHandling: 'greedy', streetViewControl: false, fullscreenControl: false, zoomControl: false}} // 取消地圖/衛星切換功能、街景小人、全螢幕功能，讓所有手勢都可以操作地圖
                onClick={handleMapClick}
            >
                {markerPosition && (
                    <>
                        <Marker position={markerPosition} />
                        {infoWindowOpen && selectedPlace && (
                            <InfoWindow
                                position={markerPosition}
                                onCloseClick={() => setInfoWindowOpen(false)}
                                options={{ maxWidth: 350}}
                                zIndex={50}
                            >
                                <div className="z-50 m-0 p-0">
                                    {handleAddToPlaceList && (
                                        <select
                                            value={selectedPlaceListId}
                                            onChange={(e) => {
                                                setSelectedPlaceListId(e.target.value);
                                                handleAddToPlaceList(e.target.value)
                                            }}
                                            className="mb-1 ml-1 p-1 bg-custom-kame text-gray-600 rounded"
                                        >
                                            <option value="">選擇欲存放清單</option>
                                            {placeLists.map((placeList) => (
                                                <option key={placeList.id} value={placeList.id}>
                                                    {placeList.title}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    <div className="p-1">
                                        <div className="relative w-[125px] h-[100px]">
                                            {placePhotoUrl && (
                                                <Image
                                                    src={placePhotoUrl}
                                                    alt={selectedPlace.name}
                                                    fill
                                                    className="rounded m-0 p-0 object-contain "
                                                />
                                            )}
                                        </div>
                                        <div className="">
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-base lg:text-lg font-bold">{selectedPlace.name}</h2>
                                                {selectedPlace.website && (
                                                <a href={selectedPlace.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                                                    官方網站
                                                </a>
                                            )}
                                            </div>
                                            {selectedPlace.formatted_address && (
                                                <div className="text-xs sm:text-sm">{selectedPlace.formatted_address}</div>
                                            )}
                                            <div className="flex items-center">
                                                <FaStar className="text-yellow-500 mr-1" />
                                                <p>{selectedPlace.rating ? `評分: ${selectedPlace.rating}/5 (${selectedPlace.user_ratings_total} 評論)` : ''}</p>
                                            </div>
                                            {selectedPlace.opening_hours?.weekday_text && Array.isArray(selectedPlace.opening_hours.weekday_text) && selectedPlace.opening_hours.weekday_text.length > 0 ? (
                                                <>
                                                    <p>開放時間：</p>
                                                        <div className="grid grid-cols-2 gap-x-2 text-xs sm:text-sm">
                                                        {selectedPlace.opening_hours?.weekday_text.map((day: string, index: number) => {
                                                            const dayNumber = day.replace('星期', '');
                                                            return (
                                                                <p key={index}>
                                                                    <span>{dayNumber}</span>
                                                                </p>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            ) : (
                                                <p>開放時間：-- </p>
                                            )}
                                            
                                        </div>
                                    </div>
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
