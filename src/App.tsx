import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import {
  CalendarDays,
  Camera,
  CloudSun,
  Compass,
  MapPin,
  Plane,
  Plus,
  Route,
  Search,
  Share2,
  Wallet,
  WifiOff,
} from 'lucide-react'
import './App.css'

type TripStatus = 'Planning' | 'Active' | 'Archived'

type Trip = {
  id: string
  title: string
  region: string
  status: TripStatus
  dates: string
  days: number
  budget: number
  spent: number
  photos: number
  weather: string
  draftCount: number
  stops: string[]
}

const trips: Trip[] = [
  {
    id: 'TR-01',
    title: 'Lisbon work sprint',
    region: 'Portugal',
    status: 'Active',
    dates: 'Jun 28 to Jul 05',
    days: 8,
    budget: 1800,
    spent: 940,
    photos: 86,
    weather: '24C, clear',
    draftCount: 3,
    stops: ['Alfama', 'Baixa', 'Belem', 'LX Factory'],
  },
  {
    id: 'TR-02',
    title: 'Cairo family loop',
    region: 'Egypt',
    status: 'Planning',
    dates: 'Aug 10 to Aug 17',
    days: 8,
    budget: 1200,
    spent: 220,
    photos: 12,
    weather: '34C, dry',
    draftCount: 5,
    stops: ['Zamalek', 'Giza', 'Maadi', 'Khan el-Khalili'],
  },
  {
    id: 'TR-03',
    title: 'Tokyo night notes',
    region: 'Japan',
    status: 'Archived',
    dates: 'Apr 02 to Apr 11',
    days: 10,
    budget: 2600,
    spent: 2480,
    photos: 214,
    weather: '18C, rain',
    draftCount: 0,
    stops: ['Shibuya', 'Ueno', 'Shimokitazawa', 'Kichijoji'],
  },
  {
    id: 'TR-04',
    title: 'Berlin maker week',
    region: 'Germany',
    status: 'Planning',
    dates: 'Sep 14 to Sep 20',
    days: 7,
    budget: 1500,
    spent: 360,
    photos: 24,
    weather: '19C, cloudy',
    draftCount: 2,
    stops: ['Kreuzberg', 'Mitte', 'Neukolln', 'Tempelhof'],
  },
]

const filters = ['All', 'Planning', 'Active', 'Archived'] as const
type Filter = (typeof filters)[number]

const currency = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 0,
  style: 'currency',
})

const theme = {
  '--accent': '#2563eb',
  '--accent-2': '#16a34a',
  '--accent-3': '#f97316',
} as CSSProperties

function getStatusClass(status: TripStatus) {
  if (status === 'Active') return 'good'
  if (status === 'Planning') return 'info'
  return 'warn'
}

function App() {
  const [filter, setFilter] = useState<Filter>('All')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(trips[0].id)
  const selected = trips.find((trip) => trip.id === selectedId) ?? trips[0]

  const visibleTrips = useMemo(() => {
    const query = search.trim().toLowerCase()
    return trips.filter((trip) => {
      const matchesFilter = filter === 'All' || trip.status === filter
      const matchesSearch =
        !query ||
        [trip.title, trip.region, trip.dates, trip.stops.join(' ')]
          .join(' ')
          .toLowerCase()
          .includes(query)

      return matchesFilter && matchesSearch
    })
  }, [filter, search])

  const activeTrips = trips.filter((trip) => trip.status === 'Active').length
  const plannedDays = trips.reduce((sum, trip) => sum + trip.days, 0)
  const photoTotal = trips.reduce((sum, trip) => sum + trip.photos, 0)
  const draftTotal = trips.reduce((sum, trip) => sum + trip.draftCount, 0)
  const spentPercent = Math.min(100, Math.round((selected.spent / selected.budget) * 100))

  return (
    <main className="app" style={theme}>
      <div className="app-shell">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">
              <Compass size={22} aria-hidden="true" />
            </span>
            <div>
              <h1>AtlasLog</h1>
              <p>Private travel journal and itinerary planner</p>
            </div>
          </div>
          <div className="toolbar">
            <button className="icon-button" type="button" aria-label="Share trip">
              <Share2 size={18} aria-hidden="true" />
            </button>
            <button className="ghost-button" type="button">
              <WifiOff size={17} aria-hidden="true" />
              Offline drafts
            </button>
            <button className="action-button" type="button">
              <Plus size={17} aria-hidden="true" />
              New trip
            </button>
          </div>
        </header>

        <section className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Travel memory workspace</p>
            <h2>Plan trips, track stops, keep offline notes, and review the whole route.</h2>
            <p>
              AtlasLog combines itinerary planning with private journaling, budget
              tracking, photo counts, weather notes, and saved drafts for travel days.
            </p>
          </div>
          <aside className="command-stack" aria-label="Trip actions">
            <button className="action-button" type="button">
              <Route size={17} aria-hidden="true" />
              Build route
            </button>
            <button className="ghost-button" type="button">
              <Camera size={17} aria-hidden="true" />
              Add photo batch
            </button>
            <button className="ghost-button" type="button">
              <Plane size={17} aria-hidden="true" />
              Sync itinerary
            </button>
          </aside>
        </section>

        <section className="stats-grid" aria-label="Travel summary">
          <article className="metric">
            <span className="metric-icon">
              <Plane size={19} aria-hidden="true" />
            </span>
            <h3>{activeTrips}</h3>
            <p>Active trip</p>
          </article>
          <article className="metric">
            <span className="metric-icon">
              <CalendarDays size={19} aria-hidden="true" />
            </span>
            <h3>{plannedDays}</h3>
            <p>Planned days</p>
          </article>
          <article className="metric">
            <span className="metric-icon">
              <Camera size={19} aria-hidden="true" />
            </span>
            <h3>{photoTotal}</h3>
            <p>Indexed photos</p>
          </article>
          <article className="metric">
            <span className="metric-icon">
              <WifiOff size={19} aria-hidden="true" />
            </span>
            <h3>{draftTotal}</h3>
            <p>Offline drafts</p>
          </article>
        </section>

        <section className="workspace-grid">
          <div className="panel">
            <div className="panel-title">
              <div>
                <h2>Trip library</h2>
                <p>Search routes, regions, and planned stops.</p>
              </div>
            </div>
            <div className="search-row">
              <label className="search-box">
                <Search size={17} aria-hidden="true" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search trips"
                />
              </label>
            </div>
            <div className="filter-row" aria-label="Trip filters">
              {filters.map((item) => (
                <button
                  className={`filter-pill ${filter === item ? 'active' : ''}`}
                  key={item}
                  onClick={() => setFilter(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Trip</th>
                    <th>Region</th>
                    <th>Dates</th>
                    <th>Days</th>
                    <th>Photos</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTrips.map((trip) => (
                    <tr key={trip.id}>
                      <td>
                        <button
                          className="row-button"
                          type="button"
                          onClick={() => setSelectedId(trip.id)}
                        >
                          <span className="strong">{trip.title}</span>
                          <br />
                          <span className="muted">{trip.stops.length} planned stops</span>
                        </button>
                      </td>
                      <td>{trip.region}</td>
                      <td>{trip.dates}</td>
                      <td>{trip.days}</td>
                      <td>{trip.photos}</td>
                      <td>
                        <span className={`status ${getStatusClass(trip.status)}`}>
                          {trip.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="panel">
            <div className="panel-title">
              <div>
                <h2>{selected.title}</h2>
                <p>{selected.region} route view</p>
              </div>
              <span className={`status ${getStatusClass(selected.status)}`}>
                {selected.status}
              </span>
            </div>
            <div className="detail-stack">
              <div className="map-surface" aria-label="Route map preview">
                {selected.stops.map((stop, index) => (
                  <span
                    className="route-pin"
                    key={stop}
                    style={{
                      left: `${16 + index * 21}%`,
                      top: `${28 + (index % 2) * 24}%`,
                    }}
                  >
                    <MapPin size={16} aria-hidden="true" />
                    {stop}
                  </span>
                ))}
              </div>
              <div className="mini-grid">
                <div className="mini-stat">
                  <p>Budget</p>
                  <strong>{currency.format(selected.budget)}</strong>
                </div>
                <div className="mini-stat">
                  <p>Spent</p>
                  <strong>{currency.format(selected.spent)}</strong>
                </div>
              </div>
              <div className="detail-row">
                <span className="muted">Budget usage</span>
                <div className="progress" aria-label={`${spentPercent} percent budget used`}>
                  <span style={{ width: `${spentPercent}%` }} />
                </div>
              </div>
              <div className="detail-row">
                <span className="muted">Route notes</span>
                <span className="split-row">
                  <span>
                    <CloudSun size={16} aria-hidden="true" /> {selected.weather}
                  </span>
                  <span>{selected.draftCount} drafts</span>
                </span>
                <span className="split-row">
                  <span>
                    <Wallet size={16} aria-hidden="true" /> Budget status
                  </span>
                  <span>{spentPercent}% used</span>
                </span>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}

export default App
