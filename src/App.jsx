import { useEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { createClient } from '@supabase/supabase-js'
import { QRCodeCanvas } from 'qrcode.react'
import { Html5Qrcode } from 'html5-qrcode'
import {
  ArrowLeft, ArrowRight, Building2, Camera, CheckCircle2, Cross, Download,
  LocateFixed, MapPin, Menu, Navigation, Search, ShieldCheck, X,
  Siren, Phone, HeartPulse, Users, User, LogOut, Clock3,
  Share2, StopCircle, ExternalLink
} from 'lucide-react'
import { findKit, loadKits } from './data'
import './App.css'

const AUTH_KEY = 'aidlocate-auth'
const CONTACTS_KEY = 'aidlocate-trusted-contacts'
const ALERTS_KEY = 'aidlocate-emergency-alerts'

function getStoredJson(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback } catch { return fallback }
}
function setStoredJson(key, value) { localStorage.setItem(key, JSON.stringify(value)) }
function getAuthUser() { return getStoredJson(AUTH_KEY, null) }
function getGeolocationErrorMessage(error) {
  if (error.code === 1) return 'Location permission was denied.'
  if (error.code === 2) return 'Your current location could not be determined.'
  if (error.code === 3) return 'The location request timed out.'
  return 'Your current location is unavailable.'
}
function makeToken() {
  if (crypto?.randomUUID) return crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '')
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`
}
function getGoogleMapsLink(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`
}
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

const kitIcon = L.divIcon({
  className: 'kit-marker',
  html: '<div class="kit-marker-inner"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 2h2v7h7v2h-7v7h-2v-7H4v-2h7V2z"/></svg></div>',
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -42],
})

const hospitalIcon = L.divIcon({
  className: 'kit-marker',
  html: '<div class="hospital-marker-inner">H</div>',
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -40],
})
const sosIcon = L.divIcon({
  className: 'kit-marker',
  html: '<div class="sos-marker-inner"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-6h2zm0-8h-2V7h2z"/></svg></div>',
  iconSize: [46, 46],
  iconAnchor: [23, 46],
  popupAnchor: [0, -44],
})
const userIcon = L.divIcon({
  className: 'kit-marker',
  html: '<div class="user-marker-inner"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
})

function Header() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState(getAuthUser())
  useEffect(() => {
    const refresh = () => setUser(getAuthUser())
    window.addEventListener('aidlocate-auth', refresh)
    return () => window.removeEventListener('aidlocate-auth', refresh)
  }, [])
  const close = () => setOpen(false)
  const nav = [
    ['/', 'Home'], ['/find', 'Find Kits'], ['/map', 'Map'], ['/hospitals', 'Hospitals'],
    ['/sos', 'SOS'], ['/contacts', 'Contacts'],
  ]
  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Link to="/" className="brand" aria-label="AidLocate home" onClick={close}>
          <span className="brand-mark"><Cross size={20} strokeWidth={3} /></span>
          <span>AidLocate</span>
        </Link>
        <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </button>
        <nav className={open ? 'nav-links open' : 'nav-links'}>
          {nav.map(([to, label]) => (
            <NavLink key={to} to={to} onClick={close} end={to === '/'}>{label}</NavLink>
          ))}
          <Link className="mobile-nav-account" to={user ? '/profile' : '/login'} onClick={close}>
            {user ? 'My Profile' : 'Log in'} <ArrowRight size={16} />
          </Link>
        </nav>
        <Link to={user ? '/profile' : '/login'} className="button button-primary nav-cta" onClick={close}>
          {user ? 'My Profile' : 'Login'} <ArrowRight size={17} />
        </Link>
      </div>
    </header>
  )
}

function PageShell({ title, description, children }) {
  return (
    <main>
      <section className="page-heading">
        <div className="container">
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
      </section>
      {children}
    </main>
  )
}

function Home() {
  return (
    <main>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <h1>Find Help.<br /><span>Find First Aid.</span><br />Stay Safe.</h1>
            <p>Search sample first-aid records, find nearby medical facilities and reach emergency support through one clear platform.</p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/find">Search Kit Records <ArrowRight size={18} /></Link>
              <Link className="button button-secondary" to="/map"><MapPin size={18} /> Open the Map</Link>
            </div>
            <Link className="text-link" to="/qr"><Camera size={17} /> Or scan a kit QR code</Link>
            <p className="home-sample-note"><MapPin size={15} /> Kit locations shown are samples, not verified for public access.</p>
          </div>
          <div className="hero-visual" aria-label="Public place first aid location illustration">
            <div className="map-card">
              <div className="map-grid"></div>
              <span className="map-route route-a"></span>
              <span className="map-route route-b"></span>
              <span className="map-building building-a">LIBRARY</span>
              <span className="map-building building-b">SCIENCE</span>
              <span className="map-building building-c">MAIN</span>
              <div className="location-pin pin-a"><Cross size={18} /></div>
              <div className="location-pin pin-b"><Cross size={18} /></div>
              <div className="hero-kit">
                <div className="kit-lid"></div>
                <Cross size={30} fill="currentColor" />
                <span>FIRST AID</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading"><span className="eyebrow">How it works</span><h2>Three simple ways to find help</h2></div>
          <div className="feature-grid">
            {[
              [Search, 'Search Kit Records', 'Search sample first-aid locations by city, building or public place.', '/find'],
              [Camera, 'Scan a QR Code', 'Scan an AidLocate code to look up its corresponding sample record.', '/qr'],
              [MapPin, 'Explore the Map', 'Compare kit-record coordinates and nearby medical facilities on a map.', '/map'],
            ].map(([Icon, title, text, to]) => (
              <Link to={to} className="feature-card" key={title}>
                <span className="feature-icon"><Icon size={26} /></span>
                <h3>{title}</h3><p>{text}</p>
                <span className="card-link">Learn more <ArrowRight size={16} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="why-section">
        <div className="container why-grid">
          <div>
            <span className="eyebrow">Why AidLocate?</span>
            <h2>Clear information when every minute matters</h2>
          </div>
          <div className="benefit-grid">
            {['Search by place or current location', 'Sample kit records clearly labeled', 'Simple QR code lookup', 'Live medical-facility search'].map((item) => (
              <div className="benefit" key={item}><CheckCircle2 size={21} /><span>{item}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container cta-card">
          <div><span className="eyebrow">Public safety starts here</span><h2>Start with a location search or browse the map.</h2></div>
          <Link className="button button-primary" to="/find">Search Kit Records <ArrowRight size={18} /></Link>
        </div>
      </section>
    </main>
  )
}

function KitCard({ kit, compact = false, onSelect, selected = false }) {
  const navigate = useNavigate()
  return (
    <article className={`${compact ? 'kit-card compact' : 'kit-card'}${selected ? ' selected' : ''}`}>
      <div className="kit-card-top">
        <span className="kit-status"><MapPin size={14} /> {kit.sample ? 'Sample record' : 'Location record'}</span>
        <span className="kit-id">{kit.id}</span>
      </div>
      <h3>{kit.locationName || kit.building}</h3>
      <div className="kit-category">{kit.category}</div>
      <div className="kit-meta"><MapPin size={17} /><div><strong>{kit.floor}</strong><span>{kit.location}</span></div></div>
      <div className="card-actions">
        <button className="button button-primary" aria-pressed={selected} onClick={() => onSelect ? onSelect(kit) : navigate(`/map?kit=${kit.id}`)}>{onSelect ? 'Show on Map' : 'View on Map'}</button>
        <Link className="button button-secondary" to={`/kit/${kit.id}`}>View Details</Link>
      </div>
    </article>
  )
}

function Locator() {
  const kits = loadKits()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All Categories')
  const [position, setPosition] = useState(null)
  const [locationError, setLocationError] = useState('')
  const [isLocating, setIsLocating] = useState(false)
  const [selectedKit, setSelectedKit] = useState(null)
  const categories = ['All Categories', ...new Set(kits.map((kit) => kit.category))]
  const filtered = useMemo(() => kits.filter((kit) => {
    const matchesCategory = category === 'All Categories' || kit.category === category
    const text = `${kit.id} ${kit.locationName} ${kit.building} ${kit.city} ${kit.floor} ${kit.location} ${kit.category}`.toLowerCase()
    return matchesCategory && text.includes(query.trim().toLowerCase())
  }), [kits, query, category])

  const distanceTo = (kit) => {
    if (!position || !kit.lat || !kit.lng) return null
    const toRad = (value) => value * Math.PI / 180
    const dLat = toRad(kit.lat - position.coords.latitude)
    const dLng = toRad(kit.lng - position.coords.longitude)
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(position.coords.latitude)) * Math.cos(toRad(kit.lat)) * Math.sin(dLng / 2) ** 2
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  const useCurrentLocation = () => {
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError('Location services are unavailable. Search manually instead.')
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (current) => {
        setPosition(current)
        setSelectedKit(null)
        setIsLocating(false)
      },
      (error) => {
        setLocationError(`${getGeolocationErrorMessage(error)} Manual search is still available.`)
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }
  const nearbyKits = position
    ? [...filtered].sort((left, right) => (distanceTo(left) ?? Infinity) - (distanceTo(right) ?? Infinity))
    : filtered

  return (
    <PageShell eyebrow="Universal Kit Locator" title="Search First Aid Kit Records" description="Use a place search or your location to compare kit records. Their locations and public access have not been verified.">
      <section className="section locator-section">
        <div className="container">
          <div className="search-panel">
            <div className="search-input-wrap">
              <Search size={21} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search city, building or public place..." aria-label="Search first aid kits" />
              {query && <button className="clear-button" onClick={() => setQuery('')} aria-label="Clear search"><X size={18} /></button>}
            </div>
            <label className="building-filter">
              <Building2 size={17} />
              <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by location category">
                {categories.map((name) => <option key={name}>{name}</option>)}
              </select>
            </label>
            <button className="button button-primary locator-location" onClick={useCurrentLocation} disabled={isLocating}><LocateFixed size={16} /> {isLocating ? 'Locating...' : 'Use My Location'}</button>
          </div>
          <div className="demo-notice sample-notice"><MapPin size={16} /><span>Sample locations only. These records are not verified and may not be publicly accessible.</span></div>
          <div className="locator-workspace">
            <div className="map-panel locator-map-panel" role="region" aria-label="Map of sample kit locations">
              <MapContainer center={[19.0760, 72.8777]} zoom={10} scrollWheelZoom={true} className="leaflet-map">
                <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocatorMapFocus position={position ? { lat: position.coords.latitude, lng: position.coords.longitude } : null} selectedKit={selectedKit} kits={nearbyKits} />
                {position && <Marker position={[position.coords.latitude, position.coords.longitude]} icon={userIcon}><Popup>Your current location</Popup></Marker>}
                {nearbyKits.filter((kit) => Number.isFinite(kit.lat) && Number.isFinite(kit.lng)).map((kit) => (
                  <Marker key={kit.id} position={[kit.lat, kit.lng]} icon={kitIcon} eventHandlers={{ click: () => setSelectedKit(kit) }}>
                    <Popup><strong>{kit.locationName || kit.building}</strong><br />Sample record — not verified</Popup>
                  </Marker>
                ))}
              </MapContainer>
              <div className="map-legend"><span className="legend-marker"></span> Sample kit coordinates · unverified</div>
            </div>
            <section className="locator-results" aria-label="First aid kit results">
              <div className="results-heading">
                <h2>{filtered.length} {filtered.length === 1 ? 'kit record' : 'kit records'}</h2>
              </div>
              {locationError && <div className="alert error"><X size={17} /> {locationError}</div>}
              {position && <div className="alert success"><LocateFixed size={17} /> Sorted by distance from your current location.</div>}
              {filtered.length ? (
                <div className="kit-grid">{nearbyKits.map((kit) => (
                  <div className="locator-result" key={kit.id}>
                    <KitCard kit={kit} compact onSelect={setSelectedKit} selected={selectedKit?.id === kit.id} />
                    <div className="locator-result-meta">
                      {distanceTo(kit) !== null && <span className="distance-label">{distanceTo(kit).toFixed(1)} km away</span>}
                      {kit.lat && kit.lng && <a className="directions-link" href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${position ? `${position.coords.latitude},${position.coords.longitude};` : ''}${kit.lat},${kit.lng}`} target="_blank" rel="noreferrer">Directions <Navigation size={14} /></a>}
                    </div>
                  </div>
                ))}</div>
              ) : (
                <div className="empty-state"><MapPin size={38} /><h3>No matching kit records</h3><p>Try another place name or clear your filters.</p><button className="button button-secondary" onClick={() => { setQuery(''); setCategory('All Categories') }}>Clear filters</button></div>
              )}
            </section>
          </div>
        </div>
      </section>
    </PageShell>
  )
}

function MapFocus({ kit }) {
  const map = useMap()
  useEffect(() => {
    if (kit) map.flyTo([kit.lat, kit.lng], 18, { duration: 0.8 })
  }, [kit, map])
  return null
}

function LocatorMapFocus({ position, selectedKit, kits }) {
  const map = useMap()
  const locationsKey = kits
    .filter((kit) => Number.isFinite(kit.lat) && Number.isFinite(kit.lng))
    .map((kit) => `${kit.lat},${kit.lng}`)
    .join('|')
  useEffect(() => {
    if (Number.isFinite(selectedKit?.lat) && Number.isFinite(selectedKit?.lng)) map.flyTo([selectedKit.lat, selectedKit.lng], 15, { duration: 0.8 })
    else if (position) map.flyTo([position.lat, position.lng], 13, { duration: 0.8 })
    else {
      const points = locationsKey.split('|').filter(Boolean).map((point) => point.split(',').map(Number))
      if (points.length) map.fitBounds(points, { padding: [36, 36], maxZoom: 11 })
    }
  }, [position, selectedKit, locationsKey, map])
  return null
}

function UserMapFocus({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.flyTo([position.lat, position.lng], 15, { duration: 0.8 })
  }, [position, map])
  return null
}

function TrackingMapFocus({ latitude, longitude }) {
  const map = useMap()
  useEffect(() => {
    if (latitude != null && longitude != null) {
      map.panTo([latitude, longitude], { animate: true, duration: 0.5 })
    }
  }, [latitude, longitude, map])
  return null
}

function CampusMap() {
  const kits = loadKits()
  const [params] = useSearchParams()
  const selectedId = params.get('kit')
  const [selected, setSelected] = useState(findKit(selectedId) || kits[0])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All Categories')
  const [userPosition, setUserPosition] = useState(null)
  const [locationError, setLocationError] = useState('')
  const [isLocating, setIsLocating] = useState(false)
  const categories = ['All Categories', ...new Set(kits.map((kit) => kit.category))]
  const list = kits.filter((kit) => {
    const matchesCategory = category === 'All Categories' || kit.category === category
    return matchesCategory && `${kit.id} ${kit.locationName} ${kit.building} ${kit.city} ${kit.location} ${kit.category}`.toLowerCase().includes(query.toLowerCase())
  })

  useEffect(() => {
    const found = findKit(selectedId)
    if (found) setSelected(found)
  }, [selectedId])

  const locateUser = () => {
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError('Geolocation is unavailable in this browser.')
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserPosition({ lat: coords.latitude, lng: coords.longitude })
        setIsLocating(false)
      },
      (error) => {
        setLocationError(`${getGeolocationErrorMessage(error)} You can still search and select map locations manually.`)
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  return (
    <PageShell eyebrow="Universal First Aid Map" title="Explore First Aid Locations" description="Browse sample kit records on the map. Their locations and public access have not been verified.">
      <section className="section map-section">
        <div className="container">
          <div className="demo-notice"><LocateFixed size={16} /> Sample demonstration locations — not verified real first aid kit locations.</div>
          <div className="map-toolbar">
            <button className="button button-secondary" onClick={locateUser} disabled={isLocating}><LocateFixed size={17} /> {isLocating ? 'Locating...' : 'Use My Location'}</button>
            {locationError && <span className="map-location-error">{locationError}</span>}
          </div>
          <div className="map-layout">
            <div className="map-panel">
              <MapContainer center={[19.0760, 72.8777]} zoom={8} scrollWheelZoom={true} className="leaflet-map">
                <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapFocus kit={selected} />
                <UserMapFocus position={userPosition} />
                {userPosition && <Marker position={[userPosition.lat, userPosition.lng]} icon={userIcon}><Popup>Your current location</Popup></Marker>}
                {list.map((kit) => (
                  <Marker key={kit.id} position={[kit.lat, kit.lng]} icon={kitIcon} eventHandlers={{ click: () => setSelected(kit) }}>
                    <Popup>
                      <strong>{kit.id}</strong><br />{kit.building}<br />{kit.floor}<br />{kit.location}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
              <div className="map-legend"><span className="legend-marker"></span> Sample kit coordinates · unverified</div>
            </div>
            <aside className="map-sidebar">
              <div className="sidebar-search"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search place or city..." /></div>
              <label className="map-category"><select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter map by category">{categories.map((name) => <option key={name}>{name}</option>)}</select></label>
              <div className="map-list">
                {list.map((kit) => (
                  <button key={kit.id} className={selected?.id === kit.id ? 'map-list-item active' : 'map-list-item'} onClick={() => setSelected(kit)}>
                    <span className="list-marker"><Cross size={14} /></span>
                    <span><strong>{kit.building}</strong><small>{kit.id} · {kit.floor}</small></span>
                  </button>
                ))}
              </div>
              {selected && (
                <div className="location-panel">
                      <span className="record-state">Selected sample record</span>
                  <h3>{selected.locationName || selected.building}</h3>
                  <p><strong>{selected.id}</strong></p>
                  <p>{selected.floor}</p>
                  <p>{selected.location}</p>
                  <Link className="button button-primary" to={`/kit/${selected.id}`}>View Full Details</Link>
                  {selected.lat && selected.lng && <a className="button button-secondary" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}>Open Directions <Navigation size={15} /></a>}
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </PageShell>
  )
}

function QRScannerPage() {
  const [manualId, setManualId] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef(null)
  const navigate = useNavigate()

  const parseQr = (text) => {
    const match = text.match(/KIT\d{3}/i)
    if (match) return findKit(match[0])
    return findKit(text)
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); await scannerRef.current.clear() } catch {}
      scannerRef.current = null
    }
    setScanning(false)
  }

  const startScanner = async () => {
    setError('')
    setResult(null)
    try {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => {
          const kit = parseQr(decoded)
          stopScanner()
          if (kit) setResult(kit)
          else setError('QR code found, but it does not match a registered AidLocate kit.')
        },
        () => {}
      )
      setScanning(true)
    } catch {
      setScanning(false)
      setError('Camera unavailable or permission denied. Use the manual kit ID option below.')
    }
  }

  useEffect(() => () => { if (scannerRef.current) scannerRef.current.stop().catch(() => {}) }, [])

  const submitManual = (event) => {
    event.preventDefault()
    setError('')
    const kit = findKit(manualId)
    if (kit) setResult(kit)
    else setError('Unknown kit ID. Try KIT001 through KIT008.')
  }

  return (
    <PageShell eyebrow="QR Code Locator" title="Scan & Locate First Aid" description="Scan the QR code attached to a first aid kit to instantly discover its location.">
      <section className="section qr-section">
        <div className="container qr-layout">
          <div className="scanner-card">
            <div id="qr-reader" className={scanning ? 'qr-reader active' : 'qr-reader'}></div>
            {!scanning && <div className="scan-placeholder"><div className="scan-frame"><Camera size={38} /></div><p>Position the QR code inside the frame</p></div>}
            <div className="scanner-actions">
              <button className="button button-primary" onClick={startScanner} disabled={scanning}><Camera size={18} /> Start Scanner</button>
              <button className="button button-secondary" onClick={stopScanner} disabled={!scanning}><X size={18} /> Stop Scanner</button>
            </div>
            {error && <div className="alert error"><X size={17} /> {error}</div>}
            <form className="manual-form" onSubmit={submitManual}>
              <label htmlFor="manual-kit">Or enter a kit ID manually</label>
              <div><input id="manual-kit" value={manualId} onChange={(e) => setManualId(e.target.value)} placeholder="Example: KIT001" /><button className="button button-primary">Locate Kit</button></div>
            </form>
          </div>

          <div className="qr-result-column">
            {result ? (
              <div className="qr-found">
                  <span className="found-icon"><MapPin size={25} /></span>
                    <span className="record-state">{result.sample ? 'Sample kit record · not verified' : 'Kit record'}</span>
                <h2>{result.id}</h2>
                    {result.sample && <p className="sample-caveat">This sample record does not confirm that a kit is present or publicly accessible.</p>}
                <dl><div><dt>Building</dt><dd>{result.building}</dd></div><div><dt>Floor</dt><dd>{result.floor}</dd></div><div><dt>Exact location</dt><dd>{result.location}</dd></div></dl>
                <button className="button button-primary" onClick={() => navigate(`/map?kit=${result.id}`)}>View on Interactive Map <ArrowRight size={17} /></button>
              </div>
            ) : (
              <div className="qr-guidance"><span className="eyebrow">How to scan</span><h3>Camera or manual entry</h3><p>Use a device camera for an attached AidLocate QR code, or enter a kit ID shown on the code.</p></div>
            )}
            <KitQRGenerator />
          </div>
        </div>
      </section>
    </PageShell>
  )
}

function KitQRGenerator() {
  const [selectedId, setSelectedId] = useState('KIT001')
  const canvasRef = useRef(null)
  const kit = findKit(selectedId)
  const qrValue = selectedId
  const download = () => {
    const canvas = canvasRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `${selectedId}-AidLocate-QR.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
  return (
    <div className="qr-generator">
      <div><span className="eyebrow">Generate kit code</span><h3>Sample kit QR codes</h3></div>
      <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} aria-label="Choose kit for QR code">
        {loadKits().map((item) => <option value={item.id} key={item.id}>{item.id} — {item.building}</option>)}
      </select>
      <div className="qr-preview" ref={canvasRef}><QRCodeCanvas value={qrValue} size={140} level="H" includeMargin /></div>
      {kit && <p className="qr-caption">{kit.building}<br />{kit.location}</p>}
      <button className="button button-secondary" onClick={download}><Download size={17} /> Download QR Code</button>
    </div>
  )
}

function KitDetails() {
  const { id } = useParams()
  const kit = findKit(id)
  if (!kit) return (
    <PageShell eyebrow="Kit Details" title="Kit not found" description="This kit ID is not registered in AidLocate.">
      <section className="section"><div className="container empty-state"><MapPin size={38} /><h3>Unknown kit ID</h3><Link className="button button-primary" to="/find">Return to Search</Link></div></section>
    </PageShell>
  )
  return (
    <PageShell eyebrow="First Aid Kit Details" title={kit.locationName || kit.building} description={kit.sample ? "Sample location record. The kit's presence and public access have not been verified." : 'Location information for this first-aid kit record.'}>
      <section className="section">
        <div className="container detail-layout">
          <div className="detail-card">
            {kit.sample && <div className="demo-notice sample-notice"><MapPin size={16} /><span>This sample record does not confirm that a kit is present or publicly accessible.</span></div>}
            <div className="detail-header"><span className="detail-icon"><Cross size={30} /></span><div><span className="kit-id">{kit.id}</span><h2>{kit.building}</h2></div></div>
            <dl className="detail-list">
              <div><dt>Location name</dt><dd>{kit.locationName || kit.building}</dd></div>
              <div><dt>Category</dt><dd>{kit.category}</dd></div>
              <div><dt>City</dt><dd>{kit.city}</dd></div>
              <div><dt>Building</dt><dd>{kit.building}</dd></div>
              <div><dt>Floor</dt><dd>{kit.floor}</dd></div>
              <div><dt>Exact location</dt><dd>{kit.location}</dd></div>
            </dl>
            <div className="detail-actions"><Link className="button button-secondary" to="/find"><ArrowLeft size={17} /> Return to Search</Link><Link className="button button-primary" to={`/map?kit=${kit.id}`}><MapPin size={17} /> View on Map</Link></div>
          </div>
          <div className="detail-qr"><span className="eyebrow">Associated QR code</span><div><QRCodeCanvas value={kit.id} size={180} level="H" includeMargin /></div><strong>{kit.id}</strong><p>Scan this code to locate the kit.</p></div>
        </div>
      </section>
    </PageShell>
  )
}

function About() {
  return (
    <PageShell eyebrow="About AidLocate" title="About AidLocate" description="AidLocate brings first aid, medical facility, SOS and trusted-contact support into one public safety platform.">
      <section className="section about-section">
        <div className="container about-grid">
          <div className="about-copy">
            <h2>The problem</h2>
            <p>Students, teachers and staff may waste valuable time searching for first aid kits because their locations are not easily accessible.</p>
            <h2>Our solution</h2>
            <p>AidLocate provides a centralized platform that combines first aid kit search, QR code identification, medical facility search and emergency support.</p>
          </div>
          <div className="about-features">
            {[
              [Search, 'First Aid Kit Locator', 'Search and filter sample kit records by place.'],
              [Camera, 'QR Code First Aid Locator', 'Identify a kit instantly using its unique code.'],
              [Navigation, 'Interactive First Aid Map', 'Explore kit locations on a connected public map.'],
            ].map(([Icon, title, text]) => <div className="about-feature" key={title}><span><Icon size={22} /></span><div><h3>{title}</h3><p>{text}</p></div></div>)}
          </div>
        </div>
      </section>
    </PageShell>
  )
}

function Hospitals() {
  const [location, setLocation] = useState(null)
  const [manual, setManual] = useState('')
  const [filter, setFilter] = useState('All')
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const haversine = (lat, lng) => {
    if (!location) return null
    const rad = (v) => v * Math.PI / 180
    const dLat = rad(lat - location.lat)
    const dLng = rad(lng - location.lng)
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(location.lat)) * Math.cos(rad(lat)) * Math.sin(dLng / 2) ** 2
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  const loadFacilities = async (lat, lng) => {
    setLoading(true)
    setError('')
    setFacilities([])
    try {
      const endpoint = new URL('https://photon.komoot.io/reverse')
      endpoint.searchParams.set('lat', String(lat))
      endpoint.searchParams.set('lon', String(lng))
      endpoint.searchParams.set('radius', '10')
      endpoint.searchParams.set('limit', '50')
      endpoint.searchParams.set('lang', 'en')
      const facilityTypes = ['hospital', 'clinic', 'doctors']
      facilityTypes.forEach((type) => {
        endpoint.searchParams.append('osm_tag', `amenity:${type}`)
      })
      const response = await fetch(endpoint)
      if (!response.ok) throw new Error('Medical facility service unavailable')
      const data = await response.json()
      const results = (data.features || []).map((feature, index) => {
        const properties = feature.properties || {}
        const [lngValue, latValue] = feature.geometry?.coordinates || []
        const type = properties.osm_value === 'hospital' ? 'Hospital'
          : properties.osm_value === 'doctors' ? 'Medical Centre'
          : properties.osm_value === 'clinic' ? 'Clinic'
          : 'Medical Facility'
        const streetAddress = [properties.housenumber, properties.street].filter(Boolean).join(' ')
        const address = [streetAddress, properties.locality, properties.city, properties.postcode]
          .filter(Boolean)
          .join(', ')
        return {
          id: `${properties.osm_type || 'place'}-${properties.osm_id ?? index}`,
          name: properties.name || type,
          type,
          address: address || null,
          phone: properties.phone || properties['contact:phone'] || null,
          lat: latValue,
          lng: lngValue,
        }
      }).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
      setFacilities(results)
      if (!results.length) setError('No nearby medical facilities were found in the live map provider.')
    } catch {
      setError('Live hospital search is unavailable. Check your internet connection or try a manual search.')
    } finally {
      setLoading(false)
    }
  }

  const useLocation = () => {
    setError('')
    if (!navigator.geolocation) {
      setError('Geolocation is unavailable. Use manual location search.')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ lat: coords.latitude, lng: coords.longitude })
        loadFacilities(coords.latitude, coords.longitude)
      },
      () => {
        setLoading(false)
        setError('Location permission was denied. Use the manual location search.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const manualSearch = async (event) => {
    event.preventDefault()
    if (!manual.trim()) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(manual)}&limit=1`)
      const data = await response.json()
      if (!data.length) throw new Error('Place not found')
      const lat = Number(data[0].lat)
      const lng = Number(data[0].lon)
      setLocation({ lat, lng })
      await loadFacilities(lat, lng)
    } catch {
      setLoading(false)
      setError('No matching place was found. Try a city or postal area.')
    }
  }

  const filtered = facilities.filter((item) => {
    if (filter === 'All') return true
    if (filter === 'Hospitals') return item.type === 'Hospital'
    if (filter === 'Clinics') return item.type === 'Clinic' || item.type === 'Medical Centre'
    return false
  })

  return (
    <PageShell eyebrow="Medical Facility Finder" title="Find Nearby Hospitals" description="Locate live medical facilities near your current location or a manually entered place.">
      <section className="section">
        <div className="container">
          <div className="hospital-controls">
            <button className="button button-primary" onClick={useLocation}><LocateFixed size={18} /> Use My Location</button>
            <form onSubmit={manualSearch} className="manual-location">
              <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Enter city or area" />
              <button className="button button-secondary">Search</button>
            </form>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Facility filter">
              {['All', 'Hospitals', 'Clinics'].map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          {loading && <div className="loading-state"><span className="spinner"></span>Searching live medical facilities...</div>}
          {error && <div className="alert error"><X size={17} /> {error}</div>}
          <div className="demo-notice live-notice"><LocateFixed size={16} /> Live OpenStreetMap results via Photon. Google Maps links open separately.</div>
          <div className="map-layout hospital-map-layout">
            <div className="map-panel">
              <MapContainer center={location ? [location.lat, location.lng] : [19.0760, 72.8777]} zoom={location ? 13 : 10} className="leaflet-map">
                <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <UserMapFocus position={location} />
                {location && <Marker position={[location.lat, location.lng]} icon={userIcon}><Popup>Your current location</Popup></Marker>}
                {filtered.map((item) => (
                  <Marker key={item.id} position={[item.lat, item.lng]} icon={hospitalIcon}>
                    <Popup>
                      <strong>{item.name}</strong><br />{item.type}
                      {item.address && <><br />{item.address}</>}
                      {item.phone && <><br />{item.phone}</>}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            <aside className="map-sidebar hospital-list">
              <div className="location-panel"><span className="eyebrow">Medical facilities</span><h3>{filtered.length} {filtered.length === 1 ? 'result' : 'results'}</h3></div>
              {!filtered.length && !loading && !error && (
                <div className="empty-state facility-empty">
                  <MapPin size={28} />
                  <h3>{facilities.length ? 'No matching facilities' : 'Search an area to begin'}</h3>
                  <p>{facilities.length ? 'Try another facility filter.' : 'Use your location or search a city to see live medical facilities.'}</p>
                </div>
              )}
              {filtered.map((item) => {
                const distance = haversine(item.lat, item.lng)
                return (
                  <div className="facility-card" key={item.id}>
                    <span className="facility-type">{item.type}</span>
                    <h3>{item.name}</h3>
                    {item.address && <p>{item.address}</p>}
                    {distance !== null && <p>{distance.toFixed(1)} km away</p>}
                    {item.phone && <a href={`tel:${item.phone.replace(/[^+\d]/g, '')}`}>{item.phone}</a>}
                    <a className="button button-secondary" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`}>Get Directions <ExternalLink size={15} /></a>
                  </div>
                )
              })}
            </aside>
          </div>
        </div>
      </section>
    </PageShell>
  )
}

function AuthPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      if (mode === 'recovery') {
        if (!supabase) throw new Error('Password recovery requires Supabase configuration.')
        const { error: authError } = await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: `${window.location.origin}/login`,
        })
        if (authError) throw authError
        setMessage('Password recovery email sent. Check your inbox.')
        return
      }
      if (supabase) {
        if (mode === 'register') {
          const { data, error: authError } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: { data: { full_name: form.fullName, phone: form.phone } },
          })
          if (authError) throw authError
          setMessage(data.user ? 'Registration successful. Check your email if confirmation is required.' : 'Registration submitted.')
          return
        }
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
        if (authError) throw authError
        const user = { id: data.user.id, fullName: data.user.user_metadata?.full_name || form.email, email: data.user.email, phone: data.user.user_metadata?.phone || '' }
        setStoredJson(AUTH_KEY, user)
      } else {
        const users = getStoredJson('aidlocate-users', [])
        if (mode === 'register') {
          if (users.some((item) => item.email.toLowerCase() === form.email.toLowerCase())) throw new Error('A demo account already exists for this email.')
          const user = { id: makeToken(), fullName: form.fullName, email: form.email, phone: form.phone, password: form.password }
          users.push(user)
          setStoredJson('aidlocate-users', users)
          setStoredJson(AUTH_KEY, { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone })
          setMessage('Demo account created successfully.')
        } else {
          const user = users.find((item) => item.email.toLowerCase() === form.email.toLowerCase() && item.password === form.password)
          if (!user) throw new Error('Invalid demo account email or password.')
          setStoredJson(AUTH_KEY, { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone })
        }
      }
      window.dispatchEvent(new Event('aidlocate-auth'))
      navigate('/profile')
    } catch {
      setError(err.message || 'Authentication failed.')
    }
  }

  return (
    <PageShell
      eyebrow="AidLocate Account"
      title={mode === 'login' ? 'Log in' : mode === 'register' ? 'Create an account' : 'Recover password'}
      description="Manage emergency contacts and consent-based location sharing."
    >
      <section className="section"><div className="container auth-layout">
        <form className="auth-card" onSubmit={submit}>
          {mode === 'register' && <label>Full name<input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>}
          <label>Email address<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          {mode === 'register' && <label>Phone number<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>}
          {mode !== 'recovery' && <label>Password<input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>}
          {error && <div className="alert error">{error}</div>}
          {message && <div className="alert success">{message}</div>}
          <button className="button button-primary">{mode === 'login' ? 'Log In' : mode === 'register' ? 'Register' : 'Send Recovery Email'}</button>
          {mode === 'login' && <button type="button" className="auth-switch" onClick={() => setMode('recovery')}>Forgot password?</button>}
          {mode !== 'login' && <button type="button" className="auth-switch" onClick={() => setMode('login')}>Return to login</button>}
          {mode === 'login' && <button type="button" className="auth-switch" onClick={() => setMode('register')}>Create a new account</button>}
          {!supabase && <p className="provider-note">Supabase is not configured. Authentication and records are currently stored only in this browser as a demonstration.</p>}
        </form>
      </div></section>
    </PageShell>
  )
}

function Profile() {
  const [user, setUser] = useState(getAuthUser())
  const [form, setForm] = useState(user ? {
    ...user,
    locationSharing: user.locationSharing || 'Ask every time',
    notifications: user.notifications || 'SMS or email',
  } : { fullName: '', email: '', phone: '', locationSharing: 'Ask every time', notifications: 'SMS or email' })
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!supabase || !user?.id) return
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (!data) return
      setForm((current) => ({
        ...current,
        fullName: data.full_name || current.fullName,
        email: data.email || current.email,
        phone: data.phone || current.phone,
        locationSharing: data.location_sharing_preferences?.mode || 'Ask every time',
        notifications: data.notification_preferences?.method || 'SMS or email',
      }))
    })
  }, [user?.id])

  const save = async (event) => {
    event.preventDefault()
    setStoredJson(AUTH_KEY, form)
    setUser(form)
    if (supabase && user?.id) {
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: form.fullName,
        email: form.email,
        phone: form.phone,
        location_sharing_preferences: { mode: form.locationSharing },
        notification_preferences: { method: form.notifications },
      })
    }
    setMessage('Profile updated successfully.')
    window.dispatchEvent(new Event('aidlocate-auth'))
  }
  const logout = () => {
    localStorage.removeItem(AUTH_KEY)
    if (supabase) supabase.auth.signOut()
    window.dispatchEvent(new Event('aidlocate-auth'))
    navigate('/login')
  }
  if (!user) return (
    <PageShell eyebrow="User Profile" title="Login required" description="Sign in to manage your AidLocate profile."><section className="section"><div className="container"><Link className="button button-primary" to="/login">Log In</Link></div></section></PageShell>
  )
  return (
    <PageShell eyebrow="User Profile" title="Your profile" description="Manage the details used for emergency alerts.">
      <section className="section"><div className="container profile-layout">
        <form className="auth-card" onSubmit={save}>
          <label>Full name<input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
          <label>Email address<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>Phone number<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label>Location sharing preference
            <select value={form.locationSharing} onChange={(e) => setForm({ ...form, locationSharing: e.target.value })}>
              <option>Ask every time</option><option>Enabled for active SOS only</option><option>Never share automatically</option>
            </select>
          </label>
          <label>Emergency notification preference
            <select value={form.notifications} onChange={(e) => setForm({ ...form, notifications: e.target.value })}>
              <option>SMS or email</option><option>SMS only</option><option>Email only</option><option>Share only</option>
            </select>
          </label>
          {message && <div className="alert success">{message}</div>}
          <button className="button button-primary">Save Profile</button>
          <button type="button" className="button button-secondary" onClick={logout}><LogOut size={17} /> Log Out</button>
        </form>
      </div></section>
    </PageShell>
  )
}

function SOSPage() {
  const user = getAuthUser()
  const contacts = getStoredJson(CONTACTS_KEY)
  const [selected, setSelected] = useState(() => contacts.filter((item) => item.primary).map((item) => item.id))
  const [confirmed, setConfirmed] = useState(false)
  const [activating, setActivating] = useState(false)
  const [status, setStatus] = useState('')
  const navigate = useNavigate()

  const activate = async () => {
    if (!confirmed) return
    setActivating(true)
    setStatus('Creating emergency alert...')
    let position = null
    try {
      position = await new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null)
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 10000 }
        )
      })
    } catch { position = null }

    const now = new Date().toISOString()
    const alert = {
      id: `SOS-${makeToken().slice(0, 10).toUpperCase()}`,
      token: makeToken(),
      userId: user?.id || 'local-user',
      name: user?.fullName || 'AidLocate user',
      status: 'active',
      sharingEnabled: true,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      latitude: position?.lat ?? null,
      longitude: position?.lng ?? null,
      contactIds: selected,
    }
    const alerts = getStoredJson(ALERTS_KEY)
    setStoredJson(ALERTS_KEY, [alert, ...alerts])

    if (supabase && user?.id) {
      await supabase.from('emergency_alerts').insert({
        id: alert.id,
        user_id: user.id,
        status: 'active',
        latitude: alert.latitude,
        longitude: alert.longitude,
        sharing_enabled: true,
        sharing_token: alert.token,
        expires_at: alert.expiresAt,
      })
      if (alert.latitude != null && alert.longitude != null) {
        await supabase.from('emergency_locations').insert({
          alert_id: alert.id,
          latitude: alert.latitude,
          longitude: alert.longitude,
        })
      }
    }

    const chosen = contacts.filter((item) => selected.includes(item.id))
    const notificationUrl = import.meta.env.VITE_NOTIFICATION_API_URL
    let deliveryMessage = 'Notification provider not configured. No notification was sent.'
    if (supabase && chosen.length) {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (!sessionData.session) throw new Error('Authentication session unavailable')
        const { data, error: functionError } = await supabase.functions.invoke('send-sos', {
          body: {
            alertId: alert.id,
            name: alert.name,
            locationUrl: position ? getGoogleMapsLink(position.lat, position.lng) : null,
            activatedAt: now,
            contacts: chosen,
          },
        })
        deliveryMessage = functionError
          ? 'Notification backend returned an error. No delivery is confirmed.'
          : `Notification backend processed ${data?.results?.length || 0} selected contact(s); delivery status shown by provider logs.`
      } catch {
        deliveryMessage = 'Notification backend could not be reached. No delivery is confirmed.'
      }
    } else if (notificationUrl && chosen.length) {
      try {
        const response = await fetch(notificationUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alertId: alert.id,
            name: alert.name,
            locationUrl: position ? getGoogleMapsLink(position.lat, position.lng) : null,
            activatedAt: now,
            contacts: chosen,
          }),
        })
        deliveryMessage = response.ok
          ? 'Notification request accepted by the configured backend.'
          : 'Notification backend responded with an error. No delivery is confirmed.'
      } catch {
        deliveryMessage = 'Notification backend could not be reached. No delivery is confirmed.'
      }
    } else if (!chosen.length) {
      deliveryMessage = 'No trusted contacts were selected. Use the share option in the tracking page.'
    }
    setStatus(deliveryMessage)
    setActivating(false)
    navigate(`/tracking/${alert.id}`)
  }

  const toggleContact = (id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])

  return (
    <PageShell eyebrow="Emergency Assistance" title="Emergency SOS" description="Activation requires explicit confirmation and is available without registration.">
      <section className="section sos-section">
        <div className="container sos-layout">
          <div className="sos-warning">
            <div className="sos-shield"><Siren size={42} /></div>
            <h2>Need immediate help?</h2>
            <p>If you or someone nearby is experiencing a life-threatening emergency, contact emergency services immediately. Do not wait for an AidLocate notification or hospital search result.</p>
            <a className="call-emergency" href="tel:112"><Phone size={21} /> Call Emergency Services — 112</a>
          </div>
          <div className="sos-panel">
            <h2>Notify trusted contacts</h2>
            {contacts.length === 0 ? (
              <div className="empty-state"><Users size={34} /><h3>No trusted contacts selected</h3><Link className="button button-secondary" to="/contacts">Add Trusted Contacts</Link></div>
            ) : (
              <div className="contact-select-list">
                {contacts.map((contact) => (
                  <label key={contact.id} className="checkbox-row sos-contact">
                    <input type="checkbox" checked={selected.includes(contact.id)} onChange={() => toggleContact(contact.id)} />
                    <span><strong>{contact.name}</strong><small>{contact.relationship || 'Trusted contact'} · {contact.notification_preference}</small></span>
                  </label>
                ))}
              </div>
            )}
            <label className="checkbox-row confirmation"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} /> I confirm that I want to activate this emergency SOS.</label>
            {status && <div className="alert">{status}</div>}
            <button className="sos-button" disabled={!confirmed || activating} onClick={activate}><Siren size={24} />{activating ? 'Activating...' : 'ACTIVATE EMERGENCY SOS'}</button>
          </div>
          <div className="emergency-actions">
            <h2>Emergency actions</h2>
            <a className="button button-danger" href="tel:112"><Phone size={18} /> Call Emergency Services</a>
            <Link className="button button-secondary" to="/hospitals"><HeartPulse size={18} /> Find Nearby Hospitals</Link>
            <Link className="button button-secondary" to="/find"><Cross size={18} /> Find Nearby First Aid Kits</Link>
          </div>
        </div>
      </section>
    </PageShell>
  )
}

function EmergencyTracking({ shared = false }) {
  const params = useParams()
  const usableAlert = useMemo(() => {
    const alerts = getStoredJson(ALERTS_KEY)
    return shared
      ? alerts.find((item) => item.token === params.token)
      : alerts.find((item) => item.id === params.id)
  }, [shared, params.token, params.id])
  const [latest, setLatest] = useState(shared && supabase ? null : usableAlert || null)
  const [watchError, setWatchError] = useState(
    shared && !usableAlert && !supabase
      ? 'Live location sharing is unavailable because the app is not connected to Supabase.'
      : ''
  )
  const [loadingShared, setLoadingShared] = useState(shared && !!supabase)
  const [shareMessage, setShareMessage] = useState('')
  const watcher = useRef(null)

  useEffect(() => {
    if (!shared) return
    if (!supabase) return

    let active = true
    let refreshing = false
    const refreshLocation = async () => {
      if (refreshing) return
      refreshing = true
      try {
        const { data, error } = await supabase.rpc('get_emergency_location', { p_token: params.token })
        if (!active) return
        if (error) {
          setWatchError('Could not refresh the live location. Checking again shortly.')
          return
        }
        if (!data?.length) {
          setLatest(null)
          setWatchError('This link is invalid, expired, or location sharing has ended.')
          return
        }
        const row = data[0]
        setLatest((current) => ({
          ...current,
          id: row.alert_id,
          token: params.token,
          name: row.person_name || 'AidLocate user',
          sharingEnabled: true,
          latitude: row.latitude,
          longitude: row.longitude,
          updatedAt: row.updated_at,
        }))
        setWatchError('')
      } catch {
        if (active) setWatchError('Could not refresh the live location. Check your connection; retrying shortly.')
      } finally {
        refreshing = false
        if (active) setLoadingShared(false)
      }
    }

    refreshLocation()
    const intervalId = window.setInterval(refreshLocation, 5000)
    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [shared, params.token])

  useEffect(() => {
    if (!usableAlert || shared || !usableAlert.sharingEnabled) return
    if (!navigator.geolocation) {
      setWatchError('Live location is unavailable in this browser.')
      return
    }
    watcher.current = navigator.geolocation.watchPosition(
      async ({ coords }) => {
        const now = new Date().toISOString()
        const updated = { ...usableAlert, latitude: coords.latitude, longitude: coords.longitude, updatedAt: now, sharingEnabled: true }
        setLatest(updated)
        setStoredJson(ALERTS_KEY, getStoredJson(ALERTS_KEY).map((item) => item.id === usableAlert.id ? updated : item))
        if (supabase) {
          try {
            const [locationResult, alertResult] = await Promise.all([
              supabase.from('emergency_locations').insert({
                alert_id: usableAlert.id,
                latitude: coords.latitude,
                longitude: coords.longitude,
                updated_at: now,
              }),
              supabase.from('emergency_alerts').update({
                latitude: coords.latitude,
                longitude: coords.longitude,
                sharing_enabled: true,
                status: 'active',
              }).eq('id', usableAlert.id),
            ])
            if (locationResult.error || alertResult.error) throw locationResult.error || alertResult.error
            setWatchError('')
          } catch {
            setWatchError('Location is updating on this device but could not sync to the shared link. Check your connection.')
          }
        }
      },
      () => setWatchError('Live updates paused. Location permission or connectivity may be unavailable.'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    )
    return () => {
      if (watcher.current !== null) navigator.geolocation.clearWatch(watcher.current)
    }
  }, [usableAlert, shared])

  const copyShareLink = async () => {
    const shareUrl = `${window.location.origin}/share/${latest.token}`
    if (!navigator.clipboard?.writeText) {
      setShareMessage('Clipboard access is unavailable. Open the link and copy it from the address bar.')
      return
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareMessage('Live-sharing link copied. Send it to your trusted contact.')
    } catch {
      setShareMessage('Could not copy the link. Open it and copy it from the address bar instead.')
    }
  }

  const stopSharing = () => {
    if (watcher.current !== null) navigator.geolocation.clearWatch(watcher.current)
    const stopped = { ...latest, sharingEnabled: false, status: 'sharing-ended', updatedAt: new Date().toISOString() }
    setLatest(stopped)
    setStoredJson(ALERTS_KEY, getStoredJson(ALERTS_KEY).map((item) => item.id === stopped.id ? stopped : item))
    if (supabase) {
      supabase.from('emergency_alerts').update({
        sharing_enabled: false,
        status: 'sharing-ended',
      }).eq('id', stopped.id)
    }
    const contacts = getStoredJson(CONTACTS_KEY).filter((item) => stopped.contactIds?.includes(item.id))
    if (supabase && contacts.length) {
      supabase.functions.invoke('send-sos', {
        body: {
          alertId: stopped.id,
          name: stopped.name,
          locationUrl: stopped.latitude != null && stopped.longitude != null
            ? getGoogleMapsLink(stopped.latitude, stopped.longitude)
            : null,
          activatedAt: stopped.updatedAt,
          status: 'sharing-ended',
          contacts,
        },
      })
    }
  }

  const hasLocation = latest?.latitude != null && latest?.longitude != null

  if (!latest) return (
    <PageShell
      eyebrow="Emergency Tracking"
      title={loadingShared ? 'Loading live location' : 'Sharing link unavailable'}
      description={loadingShared ? 'Connecting to the shared location...' : 'This emergency sharing link is invalid or has expired.'}
    >
      <section className="section"><div className="container empty-state"><ShieldCheck size={38} /><h3>{watchError || 'Unable to open emergency location'}</h3></div></section>
    </PageShell>
  )

  return (
    <PageShell
      eyebrow="Emergency Tracking"
      title={shared ? 'Emergency location update' : 'Your Emergency Location Is Being Shared'}
      description={shared
        ? "This page checks for location updates every five seconds while the sender's browser and internet connection remain active."
        : 'Live updates depend on browser permission, internet connectivity and whether the browser remains active.'}
    >
      <section className="section"><div className="container tracking-layout">
        <div className="tracking-card">
          <div className="tracking-status"><span className={latest.sharingEnabled ? 'status-live' : 'status-ended'}>{latest.sharingEnabled ? 'Live sharing active' : 'Sharing stopped'}</span><Clock3 size={17} /></div>
          <h2>{latest.name}</h2>
          <dl className="detail-list">
            <div><dt>Emergency alert ID</dt><dd>{latest.id}</dd></div>
            <div><dt>Latest location</dt><dd>{hasLocation ? `${latest.latitude.toFixed(5)}, ${latest.longitude.toFixed(5)}` : 'Location unavailable'}</dd></div>
            <div><dt>Last update</dt><dd>{new Date(latest.updatedAt).toLocaleString()}</dd></div>
          </dl>
          {hasLocation && <a className="button button-secondary" href={getGoogleMapsLink(latest.latitude, latest.longitude)} target="_blank" rel="noreferrer"><MapPin size={17} /> Open in Google Maps</a>}
          {!shared && latest.sharingEnabled && <button className="button button-danger stop-sharing" onClick={stopSharing}><StopCircle size={18} /> STOP LOCATION SHARING</button>}
          {!shared && latest.sharingEnabled && (
            <>
              <button className="button button-secondary" onClick={copyShareLink}><Share2 size={16} /> Copy live-sharing link</button>
              <a className="share-link" href={`/share/${latest.token}`} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open live-sharing link</a>
              {shareMessage && <div className="alert" role="status">{shareMessage}</div>}
            </>
          )}
          {watchError && <div className="alert error">{watchError}</div>}
        </div>
        <div className="tracking-map">
          {hasLocation ? (
            <MapContainer center={[latest.latitude, latest.longitude]} zoom={16} className="leaflet-map">
              <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <TrackingMapFocus latitude={latest.latitude} longitude={latest.longitude} />
              <Marker position={[latest.latitude, latest.longitude]} icon={sosIcon}><Popup>{latest.name}</Popup></Marker>
            </MapContainer>
          ) : <div className="empty-state"><MapPin size={38} /><h3>Location not available</h3><p>Wait for browser location permission or internet connectivity.</p></div>}
        </div>
      </div></section>
    </PageShell>
  )
}

function TrustedContacts() {
  const empty = { name: '', relationship: '', phone: '', email: '', notification_preference: 'SMS', primary: false }
  const [contacts, setContacts] = useState(getStoredJson(CONTACTS_KEY))
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user
      if (!user) return
      const { data: rows } = await supabase.from('trusted_contacts').select('*').eq('user_id', user.id).order('created_at')
      if (rows) setContacts(rows.map((item) => ({
        id: item.id,
        name: item.name,
        relationship: item.relationship,
        phone: item.phone,
        email: item.email,
        notification_preference: item.notification_preference,
        primary: item.is_primary,
      })))
    })
  }, [])

  const saveContacts = (next) => {
    setContacts(next)
    setStoredJson(CONTACTS_KEY, next)
  }
  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!form.name.trim() || (!form.phone.trim() && !form.email.trim())) {
      setError('Enter a contact name and at least a phone number or email address.')
      return
    }
    let next
    if (editingId) next = contacts.map((item) => item.id === editingId ? { ...form, id: editingId } : item)
    else next = [...contacts, { ...form, id: makeToken() }]
    if (form.primary) next = next.map((item) => ({ ...item, primary: item.id === (editingId || next[next.length - 1].id) }))
    saveContacts(next)
    if (supabase) {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user?.id
      if (userId) {
        if (editingId) {
          await supabase.from('trusted_contacts').update({
            name: form.name,
            relationship: form.relationship,
            phone: form.phone,
            email: form.email,
            notification_preference: form.notification_preference,
            is_primary: !!form.primary,
          }).eq('id', editingId).eq('user_id', userId)
        } else {
          await supabase.from('trusted_contacts').insert({
            user_id: userId,
            name: form.name,
            relationship: form.relationship,
            phone: form.phone,
            email: form.email,
            notification_preference: form.notification_preference,
            is_primary: !!form.primary,
          })
        }
      }
    }
    setForm(empty)
    setEditingId(null)
    setMessage(editingId ? 'Trusted contact updated.' : 'Trusted contact added.')
  }
  const edit = (contact) => {
    setEditingId(contact.id)
    setForm({ ...contact })
    setMessage('')
  }
  const remove = async (id) => {
    saveContacts(contacts.filter((item) => item.id !== id))
    if (supabase) await supabase.from('trusted_contacts').delete().eq('id', id)
    setMessage('Trusted contact deleted.')
  }

  return (
    <PageShell eyebrow="Emergency Contacts" title="My Trusted Contacts" description="Add people who should be notified if you activate an emergency SOS.">
      <section className="section"><div className="container trusted-layout">
        <form className="auth-card contact-form" onSubmit={submit}>
          <h2>{editingId ? 'Edit trusted contact' : 'Add trusted contact'}</h2>
          <label>Full name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Relationship<input value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} placeholder="Family, friend, colleague..." /></label>
          <label>Phone number<input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label>Email address<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>Preferred notification method<select value={form.notification_preference} onChange={(e) => setForm({ ...form, notification_preference: e.target.value })}><option>SMS</option><option>Email</option><option>Share only</option></select></label>
          <label className="checkbox-row"><input type="checkbox" checked={!!form.primary} onChange={(e) => setForm({ ...form, primary: e.target.checked })} /> Set as primary emergency contact</label>
          {error && <div className="alert error">{error}</div>}
          {message && <div className="alert success">{message}</div>}
          <button className="button button-primary">{editingId ? 'Save Contact' : 'Add Contact'}</button>
        </form>
        <div className="contact-list">
          <h2>Emergency contact list</h2>
          {contacts.length === 0 && <div className="empty-state"><Users size={34} /><h3>No trusted contacts yet</h3><p>Add at least one contact before activating an SOS.</p></div>}
          {contacts.map((contact) => (
            <article className="contact-card" key={contact.id}>
              <span className="contact-avatar"><User size={20} /></span>
              <div><h3>{contact.name}{contact.primary && <span className="primary-badge">Primary</span>}</h3><p>{contact.relationship || 'Trusted contact'} · {contact.notification_preference}</p>{contact.phone && <p>{contact.phone}</p>}{contact.email && <p>{contact.email}</p>}</div>
              <div className="contact-actions"><button className="button button-secondary" onClick={() => edit(contact)}>Edit</button><button className="button button-danger" onClick={() => remove(contact.id)}>Delete</button></div>
            </article>
          ))}
        </div>
      </div></section>
    </PageShell>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div><Link to="/" className="brand footer-brand"><span className="brand-mark"><Cross size={20} strokeWidth={3} /></span><span>AidLocate</span></Link><p>Find help, find first aid and stay safe.</p></div>
        <div className="footer-links"><h3>Explore</h3><Link to="/find">Find a Kit</Link><Link to="/map">Interactive Map</Link><Link to="/hospitals">Hospitals</Link><Link to="/qr">QR Scanner</Link><Link to="/sos">Emergency SOS</Link></div>
        <div className="footer-note"><ShieldCheck size={22} /><p>Public safety begins with fast, clear access to information.</p></div>
      </div>
      <div className="container footer-bottom"><span>© 2026 AidLocate</span><span>Find Help. Find First Aid. Stay Safe.</span></div>
    </footer>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/find" element={<Locator />} />
        <Route path="/map" element={<CampusMap />} />
        <Route path="/qr" element={<QRScannerPage />} />
        <Route path="/hospitals" element={<Hospitals />} />
        <Route path="/sos" element={<SOSPage />} />
        <Route path="/tracking/:id" element={<EmergencyTracking />} />
        <Route path="/share/:token" element={<EmergencyTracking shared />} />
        <Route path="/contacts" element={<TrustedContacts />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/kit/:id" element={<KitDetails />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Locator />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}
