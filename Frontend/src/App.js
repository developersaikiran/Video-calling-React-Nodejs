import { Route, Routes } from 'react-router-dom';
import './App.css';
import LobbyScreen from './screens/LobbyScreen';
import Room from './screens/Room';
import "bootstrap/dist/css/bootstrap.min.css"

function App() {
  return (
    <div className="App">
      <Routes>
        {/* <Route path='/' element={<Auth />} /> */}
        <Route path='/' element={<LobbyScreen />} />
        <Route path='/room/:roomId' element={<Room />} />
      </Routes>
    </div>
  );
}

export default App;
