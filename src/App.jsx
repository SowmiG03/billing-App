import { BrowserRouter, Routes, Route } from "react-router-dom";
import Billingtracker from "./pages/Billingtracker";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Billingtracker />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;