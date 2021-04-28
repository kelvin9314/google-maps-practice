import React, { useState, useEffect } from 'react'
import { InfoWindow } from '@react-google-maps/api'
import styled from 'styled-components'

const InfoDiv = styled.div`
  width: 245px;
  margin: 0 0;
  overflow: hidden;
  text-align: left;
  font-size: 0.9em;
  line-height: 24px;
  color: #7f7f7f;
  padding: 0;
  border: 0;
  font: inherit;
  vertical-align: baseline;

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

const onLoad = infoWindow => {
  console.log('infoWindow: ', infoWindow)
}

const options = {
  pixelOffset: { width: 0, height: -30 },
}

const MapInfoWIndow = ({ stationObj = {} }) => {
  const [isShow, setIsShow] = useState(false)

  useEffect(() => {
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
          <InfoDiv>
            <p>租賃站點查詢 :{stationObj.name_tw}</p>
            <p>站點位置 : {stationObj.address_tw}</p>
            {stationObj.status === 1 && stationObj.empty_spaces !== 0 && stationObj.available_spaces !== 0 ? (
              <>
                <p>
                  <span>可借車輛 : {stationObj.available_spaces} 輛</span>
                </p>
                <p>
                  <span>可停空位 : {stationObj.empty_spaces} 輛</span>
                </p>
              </>
            ) : (
              <p>
                <span>場站狀態: 暫停營運</span>
              </p>
            )}
            <p>
              <span>時間 : {stationObj.updated_at} </span>
            </p>
          </InfoDiv>
        </InfoWindow>
      )}
    </>
  )
}

export default MapInfoWIndow
