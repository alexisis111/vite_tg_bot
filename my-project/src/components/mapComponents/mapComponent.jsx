import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import { icon } from 'leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';


const MapComponent = () => {
    const mapRef = useRef(null);
    const [userLocation, setUserLocation] = useState(null); // Используем useState для маркера точки А
    const [destination, setDestination] = useState(null); // Используем useState для маркера точки Б
    const [hasLocationPermission, setHasLocationPermission] = useState(false);
    const routingControlRef = useRef(null);
    const [routeInfo, setRouteInfo] = useState('');

    const handleMapClick = (e) => {
        console.log('Map clicked:', e.latlng);
        setDestination([e.latlng.lat, e.latlng.lng]);
    };

    useEffect(() => {
        const map = mapRef.current;

        if (!hasLocationPermission && "geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation([latitude, longitude]); // Установка начального местоположения точки А
                    setHasLocationPermission(true);
                    if (map) {
                        map.setView([latitude, longitude], map.getZoom());
                    }
                },
                error => {
                    console.error('Error getting user location:', error);
                }
            );
        } else if (userLocation && map) {
            map.setView(userLocation, map.getZoom());
        }

        if (map) {
            map.on('click', handleMapClick);
        }
        return () => {
            if (map) {
                map.off('click', handleMapClick);
            }
        };
    }, [mapRef, userLocation, hasLocationPermission]);

    useEffect(() => {
        const map = mapRef.current;

        if (map && destination && userLocation) {
            if (routingControlRef.current) {
                routingControlRef.current.remove();
            }

            console.log('Creating routing control...');
            routingControlRef.current = L.Routing.control({
                waypoints: [
                    L.latLng(userLocation[0], userLocation[1]),
                    L.latLng(destination[0], destination[1])
                ],
                routeWhileDragging: true
            }).addTo(map);

            routingControlRef.current.on('routeselected', (e) => {
                const route = e.route;
                const summary = route.summary;
                const distance = summary.totalDistance;
                const distanceText = distance < 1000 ? distance.toFixed(0) + ' м' : (distance / 1000).toFixed(1) + ' км';
                const time = Math.floor(summary.totalTime / 60) + ' мин';
                setRouteInfo(`Длина маршрута: ${distanceText}, Время в пути: ${time}`);
            });
        } else {
            setRouteInfo('');
        }
    }, [userLocation, destination]);

    useEffect(() => {
        if (routingControlRef.current) {
            routingControlRef.current.on('routingstart', () => {
                const alternativesContainer = document.querySelector('.leaflet-routing-alternatives-container');
                if (alternativesContainer) {
                    alternativesContainer.style.display = 'none';
                }
            });
        }
    }, []);


    const handleRouteButtonClick = () => {
        console.log("Route button clicked");
        console.log("userLocation:", userLocation);
        console.log("destination:", destination);
        console.log("mapRef.current:", mapRef.current);

        if (!destination) {
            alert("Пожалуйста, укажите целевую точку на карте.");
            return;
        }

        if (userLocation && mapRef.current) {
            if (routingControlRef.current) {
                routingControlRef.current.remove();
            }
            routingControlRef.current = L.Routing.control({
                waypoints: [
                    L.latLng(userLocation[0], userLocation[1]),
                    L.latLng(destination[0], destination[1])
                ],
                routeWhileDragging: true
            }).addTo(mapRef.current);
        }
    };



    return (
        <div>
            <MapContainer
                center={[51.505, -0.09]}
                zoom={13}
                style={{ height: '400px' }}
                ref={mapRef}
                onClick={handleMapClick}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {userLocation && (
                    <Marker position={userLocation}  autoPan={false} />
                )}
                {destination && (
                    <Marker position={destination}  autoPan={false} />
                )}
            </MapContainer>
            <button onClick={handleRouteButtonClick}>Построить маршрут</button>
            {routeInfo && <div>{routeInfo}</div>}
        </div>
    );
}

export default MapComponent;