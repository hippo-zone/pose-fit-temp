// import './App.css';
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import ExercisePage from './pages/ExercisePage';

function App() {
  return (
    <div className="App">
      <header className="App-header">
      <BrowserRouter>
        <Routes>
          <Route path="/exercise" element={<ExercisePage />}/>
        </Routes>
      </BrowserRouter>
      </header>
    </div>
  );
}

export default App;
