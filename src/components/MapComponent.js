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



