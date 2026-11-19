export const KITS_STORAGE_KEY = 'campuscare-universal-kits'

export const firstAidKits = [
  { id: 'KIT001', category: 'Education', locationName: 'University Campus', building: 'Main Building', city: 'Vasai', floor: 'Ground Floor', location: 'Near Main Reception', lat: 19.3761, lng: 72.9037, sample: true },
  { id: 'KIT002', category: 'Shopping', locationName: 'City Centre Mall', building: 'Shopping Mall', city: 'Mumbai', floor: 'Ground Floor', location: 'Near the Ground Floor Information Desk', lat: 19.0760, lng: 72.8777, sample: true },
  { id: 'KIT003', category: 'Workplace', locationName: 'Corporate Office', building: 'Office Tower', city: 'Mumbai', floor: 'Ground Floor', location: 'Near the Reception Area', lat: 19.1010, lng: 72.8683, sample: true },
  { id: 'KIT004', category: 'Healthcare', locationName: 'General Hospital', building: 'Hospital', city: 'Navi Mumbai', floor: 'Ground Floor', location: 'Near the Outpatient Department', lat: 19.0330, lng: 73.0297, sample: true },
  { id: 'KIT005', category: 'Transportation', locationName: 'International Airport', building: 'Airport', city: 'Mumbai', floor: 'Departures Level', location: 'Inside Terminal 1', lat: 19.0896, lng: 72.8656, sample: true },
  { id: 'KIT006', category: 'Transportation', locationName: 'Central Railway Station', building: 'Railway Station', city: 'Mumbai', floor: 'Ground Level', location: 'Near the Main Concourse', lat: 18.9398, lng: 72.8353, sample: true },
  { id: 'KIT007', category: 'Workplace', locationName: 'City Hotel', building: 'Hotel', city: 'Mumbai', floor: 'Ground Floor', location: 'Near the Main Lobby', lat: 18.9220, lng: 72.8347, sample: true },
  { id: 'KIT008', category: 'Public Spaces', locationName: 'Central Recreational Park', building: 'Public Park', city: 'Pune', floor: 'Ground Level', location: 'Near the Park Entrance', lat: 18.5204, lng: 73.8567, sample: true },
]

export function loadKits() {
  const saved = localStorage.getItem(KITS_STORAGE_KEY)
  if (!saved) {
    localStorage.setItem(KITS_STORAGE_KEY, JSON.stringify(firstAidKits))
    return firstAidKits
  }
  try {
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : firstAidKits
  } catch {
    return firstAidKits
  }
}

export function findKit(id) {
  if (!id) return null
  const normalized = id.trim().toUpperCase()
  return loadKits().find((kit) => kit.id.toUpperCase() === normalized) || null
}
