import type { MockUser } from '../types'

export const mockUsers: MockUser[] = [
  {
    phone: '09123456789',
    role: 'user',
    name: 'احمد رضایی',
    documents: null,
  },
  {
    phone: '09129876543',
    role: 'doctor',
    name: 'دکتر محمد کریمی',
    documents: {
      license: 'license_09129876543.pdf',
      nationalId: 'national_09129876543.jpg',
      experience: null,
      specialty: null,
      profilePhoto: null,
    },
  },
  {
    phone: '09123456788',
    role: 'admin',
    name: 'مدیر سیستم',
    documents: null,
  },
]

export const findUserByPhone = (phone: string): MockUser | undefined =>
  mockUsers.find((u) => u.phone === phone)

export const addUser = (user: MockUser) => {
  mockUsers.push(user)
}
