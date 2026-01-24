// Test data for LightReach finance integration testing

export interface TestDataScenario {
  name: string
  description: string
  expectedStatus: string
  data: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    zip: string
    ssn?: string
  }
}

export const TEST_SCENARIOS: TestDataScenario[] = [
  // Simulated Credit Checks (any name/address works, SSN determines outcome)
  {
    name: 'Approved (High Score)',
    description: 'Approved with stipulations - FICO 802',
    expectedStatus: 'CONDITIONAL',
    data: {
      firstName: 'Test',
      lastName: 'Approved',
      email: 'approved@test.com',
      phone: '555-0001',
      address: '123 Test St',
      city: 'Test City',
      state: 'CA',
      zip: '12345',
      ssn: '500101005',
    },
  },
  {
    name: 'Approved (Good Score)',
    description: 'Approved with stipulations - FICO 761',
    expectedStatus: 'CONDITIONAL',
    data: {
      firstName: 'Test',
      lastName: 'Good',
      email: 'good@test.com',
      phone: '555-0002',
      address: '123 Test St',
      city: 'Test City',
      state: 'CA',
      zip: '12345',
      ssn: '500101006',
    },
  },
  {
    name: 'Approved (Limited Payments)',
    description: 'Approved with stipulations - FICO 724, Limited payment options',
    expectedStatus: 'CONDITIONAL',
    data: {
      firstName: 'Test',
      lastName: 'Limited',
      email: 'limited@test.com',
      phone: '555-0003',
      address: '123 Test St',
      city: 'Test City',
      state: 'CA',
      zip: '12345',
      ssn: '500101007',
    },
  },
  {
    name: 'Declined (Low Score)',
    description: 'Declined - Low credit score (550)',
    expectedStatus: 'DENIED',
    data: {
      firstName: 'Test',
      lastName: 'Declined',
      email: 'declined@test.com',
      phone: '555-0004',
      address: '123 Test St',
      city: 'Test City',
      state: 'CA',
      zip: '12345',
      ssn: '500101010',
    },
  },
  {
    name: 'Credit Frozen',
    description: 'Credit frozen - Application pending',
    expectedStatus: 'PENDING',
    data: {
      firstName: 'Test',
      lastName: 'Frozen',
      email: 'frozen@test.com',
      phone: '555-0005',
      address: '123 Test St',
      city: 'Test City',
      state: 'CA',
      zip: '12345',
      ssn: '500101015',
    },
  },
  // TransUnion Sandbox (must use exact values)
  {
    name: 'TransUnion - Approved',
    description: 'TransUnion sandbox - Approved with stipulations (671)',
    expectedStatus: 'CONDITIONAL',
    data: {
      firstName: 'Cranberry',
      lastName: 'Saucey',
      email: 'cranberry@test.com',
      phone: '555-2225',
      address: '876 Turkey St',
      city: 'Fantasy Island',
      state: 'IL',
      zip: '60750',
      ssn: '666222525',
    },
  },
  {
    name: 'TransUnion - Declined',
    description: 'TransUnion sandbox - Declined (593)',
    expectedStatus: 'DENIED',
    data: {
      firstName: 'Qjohn',
      lastName: 'Zehorne',
      email: 'qjohn@test.com',
      phone: '555-8223',
      address: '11315 Gordon st',
      city: 'Fantasy Island',
      state: 'IL',
      zip: '60750',
      ssn: '666822307',
    },
  },
  {
    name: 'TransUnion - Bankruptcy',
    description: 'TransUnion sandbox - Declined due to bankruptcy',
    expectedStatus: 'DENIED',
    data: {
      firstName: 'Jaquline',
      lastName: 'Carr',
      email: 'jaquline@test.com',
      phone: '555-7060',
      address: '229 North Oakley dr',
      city: 'Columbus',
      state: 'GA',
      zip: '31906',
      ssn: '666706006',
    },
  },
]

export function getTestScenario(name: string): TestDataScenario | undefined {
  return TEST_SCENARIOS.find((s) => s.name === name)
}
