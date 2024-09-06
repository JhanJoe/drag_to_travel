import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase-config';
import { Trip } from '../types/tripAndPlace';
import { FaUserCircle } from "react-icons/fa";

const PublicTrip: React.FC = () => {
    const [publicTrips, setPublicTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPublicTrips = async () => {
            setLoading(true);
            const tripsRef = collection(db, 'trips');
            const q = query(tripsRef, where('public', '==', true));
            const querySnapshot = await getDocs(q);
            const trips: Trip[] = [];
            querySnapshot.forEach((doc) => {
                trips.push({ id: doc.id, ...doc.data() } as Trip);
            });
            setPublicTrips(trips);
            setLoading(false);
        };

        fetchPublicTrips();
    }, []);

    const publicImages = [
        '/images/public-image-1.png',
        '/images/public-image-2.png',
        '/images/public-image-3.png',
        '/images/public-image-4.png',
        '/images/public-image-5.png',
        '/images/public-image-6.png'
    ];
    
    const getImageForTrip = (index: number) => {
        return publicImages[index % publicImages.length];
    };

    const SkeletonCard = () => (
        <div className="bg-white rounded-lg shadow-md overflow-hidden min-w-[250px] h-[250px] p-2">
            <div className="h-[60%] bg-gray-200 animate-pulse"></div>
            <div className="p-1">
                <div className="h-6 bg-gray-200 rounded w-3/4 mt-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mt-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mt-2 animate-pulse"></div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-4 pt-2 mb-10">
                {[...Array(3)].map((_, index) => (
                    <SkeletonCard key={index} />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-4 pt-2 mb-10">
            {publicTrips.map((trip, index) => (
                <Link href={`/sharing?tripId=${trip.id}`} key={trip.id}>
                    <div className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer min-w-[250px] h-[250px] p-2 active:scale-95 active:shadow-inner transition-all duration-300 ease-on-out hover:scale-105 transform hover:border-2 hover:border-custom-atomic-tangerine">

                        <div className="h-[60%] relative">
                            <Image
                                src={getImageForTrip(index)}
                                alt={trip.name}
                                layout="fill"
                                objectFit="contain"
                            />
                        </div>

                        <div className="p-1">
                            <h3 className="text-xl font-semibold">{trip.name}</h3>
                            <p className="text-sm text-gray-600">{`${trip.startDate} ~ ${trip.endDate}`}</p>
                            <p className="text-sm text-gray-500">{trip.notes}</p>

                            <div className="flex justify-center items-center gap-1 mt-1">
                                <FaUserCircle size={14} className="text-gray-500"/>
                                <p className="text-sm text-gray-500 ">
                                    分享者：{trip.userEmail?.split('@')[0]}
                                </p>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
};

export default PublicTrip;