import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom'
import './App.css'
import Map from './views/Map.jsx'

function App() {
  return (
    <Switch>
      <Route path="/map">
        <Map />
      </Route>
      {/* <Route path="/map/:bikeType">
        <Map />
      </Route> */}

      <Route path="*">
        <Redirect to="/map" />
      </Route>
    </Switch>
  )
}

export default App
