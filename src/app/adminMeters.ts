export type AdminMeterStatus = 'Active' | 'Deprecated'

export type SupportedMeter = {
  id: string
  manufacturer: string
  category: string
  meterClass: string
  model: string
  addedBy: string
  addedDate: string
  status: AdminMeterStatus
}

/**
 * Seed catalog for the admin meter-integration screens.
 * Fed by the API later; shared so the list and detail pages agree.
 */
export const seededSupportedMeters: SupportedMeter[] = [
  {
    id: 'sm-1',
    manufacturer: 'Momas',
    category: 'Prepaid',
    meterClass: 'MD',
    model: 'MMX-313-CT',
    addedBy: 'Wura',
    addedDate: '17-02-2026',
    status: 'Active',
  },
  {
    id: 'sm-2',
    manufacturer: 'Momas',
    category: 'Prepaid',
    meterClass: 'Single-Phase',
    model: 'MMX-110NG',
    addedBy: 'Margaret',
    addedDate: '17-02-2026',
    status: 'Active',
  },
  {
    id: 'sm-3',
    manufacturer: 'Momas',
    category: 'Prepaid',
    meterClass: 'Three-Phase',
    model: 'MMX-310-NG',
    addedBy: 'Moshood',
    addedDate: '17-02-2026',
    status: 'Deprecated',
  },
  {
    id: 'sm-4',
    manufacturer: 'Momas',
    category: 'Post-paid',
    meterClass: 'MD',
    model: 'MMX-312-CT',
    addedBy: 'Wura',
    addedDate: '17-02-2026',
    status: 'Active',
  },
]

export function formatAddedDate(date: Date = new Date()) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}-${month}-${date.getFullYear()}`
}
