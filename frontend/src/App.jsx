import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Landing from './pages/Landing.jsx'
import Create from './pages/Create.jsx'

export default function App() {
  const { pathname } = useLocation()

  // The Create route is a full-height workspace anchored around its composer,
  // so the footer is omitted there — it would only push the page into a scroll
  // with nothing useful at the end.
  const showFooter = pathname !== '/create'

  return (
    <div className="min-h-screen bg-ink text-mist flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/create" element={<Create />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </main>
      {showFooter && <Footer />}
    </div>
  )
}
