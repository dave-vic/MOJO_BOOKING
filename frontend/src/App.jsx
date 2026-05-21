import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Search from './pages/Search.jsx'
import SalonDetails from './pages/SalonDetails.jsx'
import Booking from './pages/Booking.jsx'
import Confirmation from './pages/Confirmation.jsx'
import NotFound from './pages/NotFound.jsx'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/salons/:id" element={<SalonDetails />} />
          <Route path="/salons/:id/book" element={<Booking />} />
          <Route path="/booking/:reference" element={<Confirmation />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
