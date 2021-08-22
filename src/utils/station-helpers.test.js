const station_helpers = require("./station-helpers")
// @ponicode
describe("station_helpers.getStationMarkerIcon", () => {
    test("0", () => {
        let callFunction = () => {
            station_helpers.getStationMarkerIcon({ type: 2 })
        }
    
        expect(callFunction).not.toThrow()
    })

    test("1", () => {
        let callFunction = () => {
            station_helpers.getStationMarkerIcon({ type: "array" })
        }
    
        expect(callFunction).not.toThrow()
    })

    test("2", () => {
        let callFunction = () => {
            station_helpers.getStationMarkerIcon({ type: 1 })
        }
    
        expect(callFunction).not.toThrow()
    })

    test("3", () => {
        let callFunction = () => {
            station_helpers.getStationMarkerIcon({ type: 0 })
        }
    
        expect(callFunction).not.toThrow()
    })

    test("4", () => {
        let callFunction = () => {
            station_helpers.getStationMarkerIcon({ type: "string" })
        }
    
        expect(callFunction).not.toThrow()
    })

    test("5", () => {
        let callFunction = () => {
            station_helpers.getStationMarkerIcon({ type: -Infinity })
        }
    
        expect(callFunction).not.toThrow()
    })
})
