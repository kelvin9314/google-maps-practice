import { useEffect } from 'react'
import { GoogleMap, LoadScript } from '@react-google-maps/api'

const containerStyle = {
  width: '100%',
  minWidth: '970px',
  height: '33.33em',
}

const center = {
  lat: -3.745,
  lng: -38.523,
}

const Map = Props => {
  useEffect(() => {
    // console.log(process.env.REACT_APP_GOOGLE_MAPS_KEY)
  }, [])

  return (
    <div style={{ display: 'grid', justifyItems: 'center' }}>
      <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_KEY}>
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10}>
          {/* Child components, such as markers, info windows, etc. */}
          <></>
        </GoogleMap>
        <div></div>
      </LoadScript>
    </div>
  )
}

export default Map
