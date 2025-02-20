// import React, { useRef, useEffect, useState } from 'react';
// import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
// import { FaLocationCrosshairs } from 'react-icons/fa6';
// import { Link } from 'react-router-dom';
// import "../assets/css/mapComponent.css";

// const containerStyle = {
//     width: '100%',
//     height: '100%'
// };

// const LocateControl = ({ map }) => {
//     const handleLocate = () => {
//         if (navigator.geolocation) {
//             navigator.geolocation.getCurrentPosition(
//                 (position) => {
//                     const pos = {
//                         lat: position.coords.latitude,
//                         lng: position.coords.longitude,
//                     };
//                     if (map) {
//                         map.panTo(pos);
//                         new window.google.maps.Marker({
//                             position: pos,
//                             map,
//                             title: 'You Are Here',
//                         });
//                     }
//                 },
//                 () => {
//                     console.error('Error: The Geolocation service failed.');
//                 }
//             );
//         } else {
//             console.error('Error: Your browser doesn\'t support geolocation.');
//         }
//     };

//     return (
//         <button
//             onClick={handleLocate}
//             style={{
//                 fontSize: '18px',
//                 position: 'absolute',
//                 bottom: 10,
//                 right: 10,
//                 zIndex: 1000,
//                 background: 'white',
//                 padding: '5px 10px',
//                 border: 'none',
//                 borderRadius: '5px',
//                 cursor: 'pointer',
//                 boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
//             }}
//         >
//             <FaLocationCrosshairs />
//         </button>
//     );
// };

// const MapComponent = React.forwardRef(({ markers = [], center }, ref) => {
//     const mapRef = useRef();
//     const [selectedMarker, setSelectedMarker] = useState(null);

//     React.useImperativeHandle(ref, () => ({
//         googleMap: mapRef.current,
//     }));

//     useEffect(() => {
//         if (mapRef.current && center?.lat && center?.lng) {
//             mapRef.current.panTo(center);
//         }
//     }, [center]);

//     return (
//         <LoadScript googleMapsApiKey="AIzaSyB2Tg0doC88mu28bu07OfPKksAcsP1iruQ">
//             <GoogleMap
//                 mapContainerStyle={containerStyle}
//                 center={center && center.lat && center.lng ? center : { lat: 0, lng: 0 }} // Default valid center
//                 zoom={12}
//                 onLoad={(map) => (mapRef.current = map)}
//             >
//                 {markers
//                     .filter(marker => marker.position?.lat && marker.position?.lng) // Filter invalid markers
//                     .map((marker, index) => (
//                         <Marker
//                             key={index}
//                             position={marker.position}
//                             onClick={() => setSelectedMarker(marker)} // Open InfoWindow on click
//                         />
//                     ))}

//                 {selectedMarker && (
//                     <InfoWindow
//                         position={selectedMarker.position}
//                         onCloseClick={() => setSelectedMarker(null)}
//                     >
//                         <div>
//                             <img src={selectedMarker.image} alt={selectedMarker.popupText} />
//                             <p className="my-2">{selectedMarker.popupText}</p>
//                             <Link to={selectedMarker.link} target="_blank" className="details-button w-100 d-block">
//                                 Request Info
//                             </Link>
//                         </div>
//                     </InfoWindow>
//                 )}

//                 {mapRef.current && <LocateControl map={mapRef.current} />}
//             </GoogleMap>
//         </LoadScript>
//     );
// });

// export default MapComponent;





import React, { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import "../assets/css/mapComponent.css";
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { FaLocationCrosshairs } from 'react-icons/fa6';
import { Link } from 'react-router-dom';

// Custom icon
const customIcon = new L.Icon({
    iconUrl: require('../assets/image/location.png'),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

const LocateControl = () => {
    const map = useMapEvents({
        locationfound(e) {
            map.flyTo(e.latlng, map.getZoom());
            L.marker(e.latlng, { icon: customIcon }).addTo(map)
                .bindPopup('You Are Here')
                .openPopup();
        },
    });

    return (
        <button
            onClick={() => map.locate({ setView: true, maxZoom: 14 })}
            style={{
                fontSize: '18px',
                position: 'absolute',
                bottom: 10,
                right: 10,
                zIndex: 1000,
                background: 'white',
                padding: '5px 10px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}
        >
            <FaLocationCrosshairs />
        </button>
    );
};

const MapComponent = React.forwardRef(({ markers, center }, ref) => {
    const mapRef = useRef();
    const markerRefs = useRef([]);

    React.useImperativeHandle(ref, () => ({
        leafletElement: mapRef.current,
        markerRefs: markerRefs.current,
    }));

    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.setView(center, 12);
        }
    }, [center]);

    const layers = [
        { name: "Street Map", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' },
        { name: "Satelite", url: "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", attribution: '&copy; Google Maps', subdomains: ['mt0', 'mt1', 'mt2', 'mt3'] },
        { name: "Night Mode", url: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png", attribution: '&copy; Stadia Maps, &copy; OpenMapTiles, &copy; OpenStreetMap contributors' }    ];

    return (
        <MapContainer center={center} zoom={12} minZoom={2} className='map_container' ref={mapRef}>
            <LayersControl position="topright">
                {layers.map((layer, index) => (
                    <LayersControl.BaseLayer key={index} name={layer.name} checked={index === 0}>
                        <TileLayer
                            url={layer.url}
                            attribution={layer.attribution}
                            subdomains={layer.subdomains || ['a', 'b', 'c']}
                        />
                    </LayersControl.BaseLayer>
                ))}
            </LayersControl>

            <LocateControl />
            <MarkerClusterGroup>
                {markers.map((marker, index) => (
                    <Marker
                        key={index}
                        position={marker.position}
                        icon={customIcon}
                        ref={(el) => {
                            markerRefs.current[index] = el;
                        }}
                    >
                        <Popup>
                            <img src={marker.image} alt={marker.popupText} /> 
                            <p className='my-2'>{marker.popupText}</p>
                            <Link to={marker.link} target="_blank" className="details-button w-100 d-block">
                                Request Info
                            </Link>
                        </Popup>
                    </Marker>
                ))}
            </MarkerClusterGroup>
        </MapContainer>
    );
});

export default MapComponent;



