import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  CssBaseline,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  ThemeProvider,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Typography,
  createTheme,
} from '@mui/material'
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt'
import CloudQueueIcon from '@mui/icons-material/CloudQueue'
import CollectionsIcon from '@mui/icons-material/Collections'
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff'
import MapIcon from '@mui/icons-material/Map'
import OfflineBoltIcon from '@mui/icons-material/OfflineBolt'
import ShareIcon from '@mui/icons-material/Share'
import WalletIcon from '@mui/icons-material/Wallet'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import Point from 'ol/geom/Point'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import Map from 'ol/Map'
import { fromLonLat } from 'ol/proj'
import OSM from 'ol/source/OSM'
import VectorSource from 'ol/source/Vector'
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style'
import View from 'ol/View'
import 'ol/ol.css'
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
  coordinates: [number, number][]
  zoom: number
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
    coordinates: [
      [-9.1291, 38.7139],
      [-9.1393, 38.7104],
      [-9.2143, 38.6968],
      [-9.1804, 38.7033],
    ],
    zoom: 12,
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
    coordinates: [
      [31.2194, 30.0525],
      [31.1342, 29.9792],
      [31.2536, 29.9602],
      [31.2625, 30.0477],
    ],
    zoom: 11,
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
    coordinates: [
      [139.7006, 35.6595],
      [139.777, 35.7148],
      [139.6677, 35.6615],
      [139.5797, 35.703],
    ],
    zoom: 11,
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
    coordinates: [
      [13.4232, 52.499],
      [13.4049, 52.52],
      [13.435, 52.481],
      [13.4034, 52.4734],
    ],
    zoom: 12,
  },
]

const filters = ['All', 'Planning', 'Active', 'Archived'] as const
type Filter = (typeof filters)[number]

const currency = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 0,
  style: 'currency',
})

const muiTheme = createTheme({
  palette: {
    background: {
      default: '#eef3f8',
      paper: '#ffffff',
    },
    primary: {
      main: '#1769aa',
    },
    secondary: {
      main: '#2e7d32',
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
})

function statusColor(status: TripStatus) {
  if (status === 'Active') return 'success'
  if (status === 'Planning') return 'primary'
  return 'warning'
}

function App() {
  const [filter, setFilter] = useState<Filter>('All')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(trips[0].id)
  const mapRef = useRef<HTMLDivElement | null>(null)
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

  useEffect(() => {
    if (!mapRef.current) return

    const transformed = selected.coordinates.map((coordinate) => fromLonLat(coordinate))
    const route = new Feature({
      geometry: new LineString(transformed),
    })
    route.setStyle(
      new Style({
        stroke: new Stroke({ color: '#1769aa', width: 4 }),
      }),
    )

    const pins = transformed.map(
      (coordinate) =>
        new Feature({
          geometry: new Point(coordinate),
        }),
    )

    pins.forEach((pin) =>
      pin.setStyle(
        new Style({
          image: new CircleStyle({
            fill: new Fill({ color: '#2e7d32' }),
            radius: 7,
            stroke: new Stroke({ color: '#ffffff', width: 3 }),
          }),
        }),
      ),
    )

    const map = new Map({
      layers: [
        new TileLayer({ source: new OSM() }),
        new VectorLayer({
          source: new VectorSource({
            features: [route, ...pins],
          }),
        }),
      ],
      target: mapRef.current,
      view: new View({
        center: transformed[0],
        zoom: selected.zoom,
      }),
    })

    return () => map.setTarget(undefined)
  }, [selected])

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <main className="atlaslog-app">
        <AppBar color="inherit" elevation={1} position="sticky">
          <Toolbar className="atlaslog-toolbar">
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <MapIcon color="primary" />
              <div>
                <Typography variant="h6">AtlasLog</Typography>
                <Typography color="text.secondary" variant="caption">
                  Material UI travel planner with OpenLayers maps
                </Typography>
              </div>
            </Stack>
            <Stack direction="row" spacing={1} className="atlaslog-actions">
              <Button startIcon={<ShareIcon />} variant="outlined">
                Share
              </Button>
              <Button startIcon={<AddLocationAltIcon />} variant="contained">
                New trip
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" className="atlaslog-shell">
          <Box className="atlaslog-hero">
            <Box>
              <Typography
                color="primary"
                sx={{ fontWeight: 700, textTransform: 'uppercase' }}
                variant="body2"
              >
                OpenLayers route workspace
              </Typography>
              <Typography variant="h2">Plan trips on a real map surface.</Typography>
              <Typography color="text.secondary" variant="body1">
                Search trips, track offline drafts, review budgets, and switch routes without
                a handmade map mockup.
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} className="atlaslog-summary">
              <Card>
                <CardContent>
                  <FlightTakeoffIcon color="primary" />
                  <Typography variant="h5">{activeTrips}</Typography>
                  <Typography color="text.secondary">Active</Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <CollectionsIcon color="primary" />
                  <Typography variant="h5">{photoTotal}</Typography>
                  <Typography color="text.secondary">Photos</Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <OfflineBoltIcon color="primary" />
                  <Typography variant="h5">{draftTotal}</Typography>
                  <Typography color="text.secondary">Drafts</Typography>
                </CardContent>
              </Card>
            </Stack>
          </Box>

          <Box className="atlaslog-grid">
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <TextField
                    label="Search trips"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <ToggleButtonGroup
                    color="primary"
                    exclusive
                    fullWidth
                    value={filter}
                    onChange={(_, value: Filter | null) => {
                      if (value) setFilter(value)
                    }}
                  >
                    {filters.map((item) => (
                      <ToggleButton key={item} value={item}>
                        {item}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                  <List>
                    {visibleTrips.map((trip) => (
                      <ListItemButton
                        key={trip.id}
                        onClick={() => setSelectedId(trip.id)}
                        selected={trip.id === selected.id}
                      >
                        <ListItemText
                          primary={trip.title}
                          secondary={`${trip.region} · ${trip.dates} · ${trip.stops.length} stops`}
                        />
                        <Chip color={statusColor(trip.status)} label={trip.status} size="small" />
                      </ListItemButton>
                    ))}
                  </List>
                </Stack>
              </CardContent>
            </Card>

            <Card className="atlaslog-map-card">
              <div ref={mapRef} className="atlaslog-map" />
            </Card>

            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
                  >
                    <Box>
                      <Typography variant="h5">{selected.title}</Typography>
                      <Typography color="text.secondary">{selected.region}</Typography>
                    </Box>
                    <Chip color={statusColor(selected.status)} label={selected.status} />
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    <Chip icon={<FlightTakeoffIcon />} label={`${plannedDays} total days`} />
                    <Chip icon={<CloudQueueIcon />} label={selected.weather} />
                    <Chip icon={<CollectionsIcon />} label={`${selected.photos} photos`} />
                  </Stack>
                  <Box>
                    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                      <Typography>
                        <WalletIcon fontSize="small" /> Budget
                      </Typography>
                      <Typography>
                        {currency.format(selected.spent)} of {currency.format(selected.budget)}
                      </Typography>
                    </Stack>
                    <LinearProgress value={spentPercent} variant="determinate" />
                  </Box>
                  <Box>
                    <Typography gutterBottom sx={{ fontWeight: 700 }}>
                      Route stops
                    </Typography>
                    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                      {selected.stops.map((stop) => (
                        <Chip key={stop} label={stop} variant="outlined" />
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Container>
      </main>
    </ThemeProvider>
  )
}

export default App
