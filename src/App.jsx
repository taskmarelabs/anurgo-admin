import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { getSession, onSessionChange } from './lib/auth.js'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Bookings from './pages/Bookings.jsx'
import Partners from './pages/Partners.jsx'
import Users from './pages/Users.jsx'
import Payouts from './pages/Payouts.jsx'
import Services from './pages/Services.jsx'
import Categories from './pages/Categories.jsx'

export default function App() {
  const [signedIn, setSignedIn] = useState(() => Boolean(getSession()?.token))

  useEffect(() => onSessionChange((session) => setSignedIn(Boolean(session?.token))), [])

  if (!signedIn) return <Login />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="partners" element={<Partners />} />
        <Route path="users" element={<Users />} />
        <Route path="payouts" element={<Payouts />} />
        <Route path="services" element={<Services />} />
        <Route path="categories" element={<Categories />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
