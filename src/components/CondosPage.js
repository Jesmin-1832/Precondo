import React, { useEffect, useState, useRef } from "react";
import { Container, Row, Col, Card, Button, Alert, Pagination, Placeholder, Form, ButtonGroup } from "react-bootstrap";
import "../assets/css/condosPage.css";
import MapComponent from './MapComponent';
import { Link, useParams } from "react-router-dom";
import { IoLocationSharp } from "react-icons/io5";
import { FaBuilding } from "react-icons/fa6";

const CondosPage = ({ defaultLocation }) => {
    const slugParams = useParams();
    const [condos, setCondos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterOption, setFilterOption] = useState("");
    const [condoContent, setCondoContent] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const mapRef = useRef();
    const [mapCenter, setMapCenter] = useState([43.65107, -79.347015]); 

    const getMapPosition = (latitude, longitude) => {
        if (latitude && longitude) {
            return [latitude, longitude];
        }
        return null;
    };

    useEffect(() => {
        const fetchCondos = async (status = 'selling-now', locationSlug = '') => {
            setLoading(true);
            try {
                const response = await fetch(
                    `https://precondo.ca/wp-json/wp/v2/lv_listing?per_page=12&page=${page}&lv_location=${locationSlug}${status === 'all' ? '' : `&lv_status=${status}`}`
                );

                if (!response.ok) throw new Error("Network response was not ok");

                const data = await response.json();
                const totalPagesHeader = response.headers.get("X-WP-TotalPages");
                setTotalPages(totalPagesHeader ? parseInt(totalPagesHeader, 10) : 1);

                setCondos(data.map(item => ({
                    id: item.id,
                    title: item.title?.rendered || "No Title",
                    image: item.yoast_head_json?.og_image?.[0]?.url || "https://precondo.ca/wp-content/uploads/2024/08/precondo-1.jpeg",
                    link: item.link || "#",
                    occupancy: item.occupancy?.[0]?.slug || "N/A",
                    developer: item.developer?.[0]?.name || "N/A",
                    description: item.excerpt?.rendered || "Description not available",
                    latitude: item.custom_fields?.lv_listing_lat || 0,
                    longitude: item.custom_fields?.lv_listing_lng || 0,
                    locality: item.custom_fields?.lv_listing_locality || "N/A",
                    position: item.custom_fields?.lv_listing_lat && item.custom_fields?.lv_listing_lng
                        ? [item.custom_fields.lv_listing_lat, item.custom_fields.lv_listing_lng]
                        : null,
                    status: item.class_list?.includes('listing_amenities-sold-out') ? 'Sold Out' : 'Selling Now'
                })));

                setLoading(false);
            } catch (error) {
                console.error("Error fetching condos:", error);
                setError(error.message);
                setLoading(false);
            }
        };

        fetchCondos(statusFilter, selectedLocation); 
    }, [statusFilter, page, selectedLocation]);

    useEffect(() => {
        if (condos.length > 0 && condos[0].position) {
            setMapCenter(condos[0].position);
        }
    }, [condos]);

    const handleStatusChange = (status) => {
        setStatusFilter(status);
        setPage(1);
    };

    useEffect(() => {
        if (!defaultLocation.length) return; 

        let selectedLocation = defaultLocation[0]; 

        if (slugParams['slug']) {
            defaultLocation.forEach(location => {
                if (location.slug === slugParams['slug']) {
                    selectedLocation = location;
                } else if (location.children) {
                    const childLocation = location.children.find(child => child.slug === slugParams['slug']);
                    if (childLocation) {
                        selectedLocation = childLocation;
                    }
                }
            });
        }

        if (selectedLocation) {
            fetch(`https://precondo.ca/wp-json/wp/v2/listing_location/?slug=${selectedLocation.slug}`)
                .then(response => response.json())
                .then(data => {
                    setCondoContent(data);
                });

            setFilterOption(selectedLocation.id.toString());
            setSelectedLocation(selectedLocation.slug); 
        } else {
            console.warn(`${slugParams['slug']}`);
        }
    }, [slugParams, defaultLocation]);


    const handleLocationChange = (event) => {
        const selectedValue = event.target.value.trim();
        if (!selectedValue || selectedValue === "▸") {
            console.log("Resetting location filter.");
            setFilterOption("");
            setSelectedLocation(''); 
            return;
        }

        let selectedLocation = defaultLocation.find(location => location.slug.toLowerCase() === selectedValue.toLowerCase());
        if (!selectedLocation) {
            defaultLocation.forEach(parent => {
                const childLocation = parent.children?.find(child => child.slug.toLowerCase() === selectedValue.toLowerCase());
                if (childLocation) selectedLocation = childLocation;
            });
        }

        if (selectedLocation) {
            setFilterOption(selectedLocation.id.toString());
            setSelectedLocation(selectedLocation.slug); 
            window.history.pushState({}, '', `/${selectedLocation.slug}`); 
        } else {
            console.warn(`Location not found for slug: ${selectedValue}`);
        }
    };

    const handlePageChange = (pageNumber) => {
        if (pageNumber !== page) {
            setPage(pageNumber);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const filteredCondos = condos;

    const condosPerPage = 12;
    const displayedCondos = filteredCondos;
    const totalFilteredPages = totalPages;

    const markers = condos
        .filter(condo => condo.position) 
        .map(condo => ({
            position: condo.position,
            popupText: condo.title,
            image: condo.image,
            link: condo.link
        }));

    const handleMoveToLocation = (condo, localIndex) => {
        const globalIndex = localIndex; 
        if (condo.latitude && condo.longitude && condo.latitude !== "Location not available" && condo.longitude !== "Longitude not available") {
            const position = [condo.latitude, condo.longitude];
            moveToLocation(position, globalIndex);
        } else {
            console.error("Invalid position for condo:", condo);
        }
    };

    const moveToLocation = (position, markerIndex, retryCount = 0) => {
        if (mapRef.current && mapRef.current.leafletElement && position) {
            const map = mapRef.current.leafletElement;
            map.setView(position, 16);
            const marker = mapRef.current.markerRefs[markerIndex];
            if (marker) {
                marker.openPopup();
            } else {
                console.error("Marker not found for index:", markerIndex);
            }
        } else {
            console.error("Map or position not found");
        }
    };

    const fallbackImage = "https://precondo.ca/wp-content/uploads/2024/08/precondo-1.jpeg";

    const centerPosition = condos.length > 0 && condos[0].position ? condos[0].position : [43.65107, -79.347015];

    const startCardIndex = (page - 1) * condosPerPage + 1;
    const endCardIndex = Math.min(page * condosPerPage, Math.max(condos.length, startCardIndex + condosPerPage - 1));

    return (
        <Container fluid className="page-container">
            {error && <Alert variant="danger">{error}</Alert>}
            <Row className="content-row">
                <Col md={6} xl={7} className="condo-list">
                    <div className="filter-controls">
                        <div className="status-buttons">
                            <ButtonGroup>
                                <Button
                                    style={{
                                        backgroundColor: statusFilter === 'all' ? '#2c6b9b' : '#fff',
                                        borderColor: statusFilter === 'all' ? '#2c6b9b' : '#2c6b9b',
                                        color: statusFilter === 'all' ? '#fff' : '#000'
                                    }}
                                    onClick={() => handleStatusChange('all')}
                                >
                                    All
                                </Button>
                                <Button
                                    style={{
                                        backgroundColor: statusFilter === 'selling-now' ? '#2c6b9b' : '#fff',
                                        borderColor: statusFilter === 'selling-now' ? '#2c6b9b' : '#2c6b9b',
                                        color: statusFilter === 'selling-now' ? '#fff' : '#000'
                                    }}
                                    onClick={() => handleStatusChange('selling-now')}
                                >
                                    Selling Now
                                </Button>
                                <Button
                                    style={{
                                        backgroundColor: statusFilter === 'sold-out' ? '#2c6b9b' : '#fff',
                                        borderColor: statusFilter === 'sold-out' ? '#2c6b9b' : '#2c6b9b',
                                        color: statusFilter === 'sold-out' ? '#fff' : '#000'
                                    }}
                                    onClick={() => handleStatusChange('sold-out')}
                                >
                                    Sold Out
                                </Button>
                            </ButtonGroup>
                        </div>
                        <Form.Control
                            as="select"
                            className="dropdown-control focus-ring focus-ring-light"
                            value={selectedLocation}
                            onChange={handleLocationChange}
                        >
                            <option>-- Select a location --</option>
                            {defaultLocation.map((location) => (
                                <React.Fragment key={location.id}>
                                    <option value={location.slug}>
                                        {location.name} ({location.count})
                                    </option>
                                    {location.children?.map((child) => (
                                        <option key={child.id} value={child.slug}>
                                            &nbsp;▸&nbsp;{child.name} ({child.count})
                                        </option>
                                    ))}
                                </React.Fragment>
                            ))}
                        </Form.Control>

                    </div>
                    <Row className="w-100 m-auto">
                        {loading ? (
                            Array.from({ length: condosPerPage }).map((_, index) => (
                                <Col md={12} xl={6} xxl={4} key={index} className="mb-2 p-1">
                                    <Card className="condo-card text-start">
                                        <div style={{ height: "200px", overflow: "hidden" }}>
                                            <Placeholder as={Card.Img} variant="top" className="condo-image" bg="secondary" />
                                        </div>
                                        <Card.Body>
                                            <Placeholder as={Card.Title} animation="glow">
                                                <Placeholder xs={12} size="lg" bg="secondary" />
                                            </Placeholder>
                                            <Placeholder as={Card.Text} animation="glow">
                                                <Placeholder xs={8} bg="secondary" />
                                            </Placeholder>
                                            <Placeholder className="d-flex justify-content-between" animation="glow">
                                                <Placeholder bg="secondary" xs={5} size="lg" />
                                                <Placeholder bg="secondary" xs={5} size="lg" />
                                            </Placeholder>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))
                        ) : (
                            displayedCondos.length > 0 ? (
                                displayedCondos.map((condo, localIndex) => (
                                    <Col md={12} xl={6} xxl={4} key={condo.id} className="mb-1 p-2">
                                        <Card className="condo-card">
                                            <div style={{ height: "200px", overflow: "hidden" }}>
                                                <Card.Img
                                                    variant="top"
                                                    src={condo.image}
                                                    alt="image"
                                                    className="condo-image"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }}
                                                />
                                                <span className="occupancy">{condo.occupancy}</span>
                                                <span className="status">{condo.status}</span>
                                            </div>
                                            <Card.Body>
                                                <Card.Text className="condo-price">$ 0,00,000+</Card.Text>
                                                <Card.Title className="condo-title">{condo.title}</Card.Title>
                                                <div>
                                                    <Card.Text className="condo-locality"><IoLocationSharp />{condo.locality}</Card.Text>
                                                    <Card.Text className="condo-developer"><FaBuilding />{condo.developer}</Card.Text>
                                                </div>
                                            </Card.Body>
                                            <div className="row justify-content-around align-items-center gap-1 mt-2 mb-3 w-100 m-auto">
                                                <Link to={condo.link} target="_blank" className="details-button">
                                                    Request Info
                                                </Link>
                                                <Button variant="secondary" className="location-button" onClick={() => handleMoveToLocation(condo, localIndex)}>
                                                    <IoLocationSharp /> Show Map
                                                </Button>
                                            </div>
                                        </Card>
                                    </Col>
                                ))
                            ) : (
                                <Col className="text-center">
                                    <Alert variant="warning">Loading Or Not Found</Alert>
                                </Col>
                            )
                        )}
                    </Row>
                    <Pagination className="justify-content-center mt-4">
                        <Pagination.Prev onClick={() => handlePageChange(page - 1)} disabled={page === 1} />
                        {page > 1 && <Pagination.Item onClick={() => handlePageChange(1)}>1</Pagination.Item>}
                        {page > 3 && <Pagination.Ellipsis />}
                        {page > 2 && (
                            <Pagination.Item onClick={() => handlePageChange(page - 1)}>{page - 1}</Pagination.Item>
                        )}
                        <Pagination.Item active>{page}</Pagination.Item>
                        {page < totalFilteredPages - 1 && (
                            <Pagination.Item onClick={() => handlePageChange(page + 1)}>{page + 1}</Pagination.Item>
                        )}
                        {page < totalFilteredPages - 2 && <Pagination.Ellipsis />}
                        {page < totalFilteredPages && (
                            <Pagination.Item onClick={() => handlePageChange(totalFilteredPages)}>
                                {totalFilteredPages}
                            </Pagination.Item>
                        )}
                        <Pagination.Next onClick={() => handlePageChange(page + 1)} disabled={page === totalFilteredPages} />
                    </Pagination>
                    <div className="card-range">
                        <b>{condos.length}</b> Condos In <b>{startCardIndex}</b> To <b>{endCardIndex - 12 + condos.length}</b>.
                    </div>

                    {condoContent.length > 0 && (
                        <div className="condo-content">
                            {condoContent.map((content, index) => (
                                <div key={index}>
                                    <p dangerouslySetInnerHTML={{ __html: content.description }}></p>
                                </div>
                            ))}
                        </div>
                    )}
                </Col>

                <Col md={6} xl={5} className="map-container">
                    {loading ? (
                        <Placeholder as="div" animation="glow" className="sticky-map">
                            <Placeholder xs={12} className="map-frame" bg="secondary" />
                        </Placeholder>
                    ) : (
                        <div className="sticky-map">
                            <MapComponent markers={markers} className="map-frame" ref={mapRef} center={mapCenter} />
                        </div>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default CondosPage;


