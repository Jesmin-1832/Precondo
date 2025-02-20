import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import CondosPage from './components/CondosPage';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function App() {
  const [defaultLocation, setDefaultLocation] = useState([]);

  useEffect(() => {
    fetch('https://precondo.ca/wp-json/wp/v2/locations/')
      .then(response => response.json())
      .then(data => {
        if (data.length > 0) {  
          setDefaultLocation(data); 
        }
      })
      .catch(error => console.error('Error fetching locations:', error));
  }, []);

  if (defaultLocation.length === 0) {
    return <div className='fs-3 text-center my-4'>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/${defaultLocation[0].slug}`} />} />
      <Route path="/:slug" element={<CondosPage defaultLocation={defaultLocation} />} />
    </Routes>
  );
}

export default App;


