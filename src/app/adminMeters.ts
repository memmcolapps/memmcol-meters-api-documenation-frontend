export type AdminMeterStatus = 'Active' | 'Deprecated'

export type SupportedMeter = {
  id: string
  manufacturer: string
  category: string
  meterClass: string
  model: string
  protocol: string
  authenticationType: string
  description: string
  addedBy: string
  addedDate: string
  status: AdminMeterStatus
}

export function formatAddedDate(date: Date = new Date()) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}-${month}-${date.getFullYear()}`
}
