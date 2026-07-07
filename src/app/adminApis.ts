export type AdminApiStatus = 'Active' | 'Deprecated'
export type AdminApiPublication = 'Published' | 'Unpublished'

export type AdminApi = {
  id: string
  name: string
  route: string
  cost: string
  snippetLang: string
  samplePayload: string
  sampleRequest: string
  documentation: string
  addedBy: string
  addedDate: string
  status: AdminApiStatus
  publication: AdminApiPublication
}

const sampleJson = `{
"productId": "PROD-101",
"name": "Wireless Mouse",
"quantity": 1
}`

const sampleDocs = `Comments are lines of text in source code files that typically are not executed as part of the program. They are small notes or annotations written by those working on the code. Often, they provide context or explain the reasoning behind implementation decisions.
Comments are essential for explaining non-obvious details around how and why the code has been written in a particular way to help those working on the code in the future. As such, when it comes to providing relevant and perhaps higher-level documentation to the end consumer on the functionality of your code, there are much more appropriate solutions such as docstrings.
Although extremely useful, you should use code comments sparingly. Excessive use of code comments often leads to redundancy and can, ironically, make your code harder to read. It is easy to fail to update comments as you change code. However, outdated and irrelevant comments are likely to confuse or mislead.`

function makeApi(overrides: Partial<AdminApi> & Pick<AdminApi, 'id' | 'name' | 'route'>): AdminApi {
  return {
    cost: '2',
    snippetLang: 'TypeScript',
    samplePayload: sampleJson,
    sampleRequest: sampleJson,
    documentation: sampleDocs,
    addedBy: 'Wura',
    addedDate: '17-02-2026',
    status: 'Active',
    publication: 'Published',
    ...overrides,
  }
}

/**
 * Seed catalog for the admin API-management screens.
 * Fed by the API later; shared so the list and detail pages agree.
 */
export const seededAdminApis: AdminApi[] = [
  makeApi({
    id: 'api-1',
    name: 'Send Token',
    route: 'www.memmserve.com/send-token',
  }),
  makeApi({
    id: 'api-2',
    name: 'Monitor Activities',
    route: 'www.memmserve.com/monitor-activities',
    addedBy: 'Margaret',
  }),
  makeApi({
    id: 'api-3',
    name: 'Real-time Update',
    route: 'www.memmserve.com/real-time-update',
    addedBy: 'Moshood',
    status: 'Deprecated',
    publication: 'Unpublished',
  }),
  makeApi({
    id: 'api-4',
    name: 'Remote Readings',
    route: 'www.memmserve.com/remote-readings',
    publication: 'Unpublished',
  }),
]
