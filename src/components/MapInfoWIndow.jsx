import React, { useState, useEffect } from 'react'
import { InfoWindow } from '@react-google-maps/api'
import styled from 'styled-components'

const InfoDiv = styled.div`
  width: 245px;
  margin: 0;
  overflow: hidden;
  text-align: left;
  font-size: 0.9em;
  line-height: 24px;
  color: #7f7f7f;

  p {
    b {
      padding: 0 0.25em 0 0;
      letter-spacing: -0.01em;

      &:before {
        content: ':';
        display: inline-block;
        width: max-content;
        padding: 0 0.1em;
      }
    }

    &span {
      display: inline-block;
      height: 1.3em;

      b {
        float: left;
      }

      &:before {
        content: 'YouBike 2.0';
        width: max-content;
        letter-spacing: -0.01em;
        display: inline-block;
        float: left;
      }

      i {
        display: inline-block;
        width: 10px;
        height: 21px;
        float: left;
      }

      &.NB_20E {
        i:before {
          content: 'E';
          display: inline-block;
          width: 0.5em;
          text-indent: 0.12em;
        }
      }
    }
  }
`

const divStyle = {
  background: `white`,
  border: `1px solid #ccc`,
  padding: 15,
}

const onLoad = infoWindow => {
  console.log('infoWindow: ', infoWindow)
}

const options = {}

// const position = {
//   lat: 25.047924,
//   lng: 121.517081,
// }

const MapInfoWIndow = ({ stationObj = {} }) => {
  const [isShow, setIsShow] = useState(false)
  // React.useCallback(function callback(stationObj) {
  //   console.log(stationObj)
  //   setIsShow(Object.keys(stationObj).length > 0)
  // }, [])

  useEffect(() => {
    // console.log(stationObj)
    setIsShow(Object.keys(stationObj).length > 0)
  }, [stationObj])
  return (
    <>
      {isShow && (
        <InfoWindow
          onLoad={onLoad}
          position={{ lat: Number(stationObj.lat), lng: Number(stationObj.lng) }}
          options={options}
          onCloseClick={() => setIsShow(false)}
        >
          <div style={divStyle}>
            <h1>InfoWindow</h1>
          </div>
        </InfoWindow>
      )}
    </>
  )
}

export default MapInfoWIndow
