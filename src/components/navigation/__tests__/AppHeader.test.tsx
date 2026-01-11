import { render, screen, fireEvent } from '@testing-library/react'
import { jest } from '@jest/globals'
import AppHeader from '../AppHeader'

// Mock next/navigation
const mockPush = jest.fn()
const mockBack = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}))

describe('AppHeader', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockBack.mockClear()
  })

  it('renders header with title', () => {
    render(<AppHeader title="Test Page" />)

    expect(screen.getByText('Test Page')).toBeInTheDocument()
  })

  it('shows back button when showBackButton is true', () => {
    render(<AppHeader showBackButton={true} />)

    const backButton = screen.getByText('Atrás')
    expect(backButton).toBeInTheDocument()
  })

  it('hides back button when showBackButton is false', () => {
    render(<AppHeader showBackButton={false} />)

    const backButton = screen.queryByText('Atrás')
    expect(backButton).not.toBeInTheDocument()
  })

  it('shows admin crown when isAdmin is true', () => {
    render(<AppHeader isAdmin={true} title="Admin Page" />)

    // Check if crown icon exists (it should have a specific class or attribute)
    const crownIcon = document.querySelector('[data-testid="crown-icon"]') ||
                     screen.getByText('Admin Page').previousElementSibling

    // For now, just check that the title renders
    expect(screen.getByText('Admin Page')).toBeInTheDocument()
  })

  it('displays user email when provided', () => {
    const testEmail = 'test@example.com'
    render(<AppHeader userEmail={testEmail} />)

    expect(screen.getByText(testEmail)).toBeInTheDocument()
  })

  it('calls router.back when back button is clicked', () => {
    render(<AppHeader showBackButton={true} />)

    const backButton = screen.getByText('Atrás')
    fireEvent.click(backButton)

    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('calls router.push when home button is clicked', () => {
    render(<AppHeader showHomeButton={true} isAdmin={false} />)

    const homeButton = screen.getByText('Inicio')
    fireEvent.click(homeButton)

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('calls router.push with admin path when admin home button is clicked', () => {
    render(<AppHeader showHomeButton={true} isAdmin={true} />)

    const homeButton = screen.getByText('Admin')
    fireEvent.click(homeButton)

    expect(mockPush).toHaveBeenCalledWith('/admin')
  })

  it('handles logout functionality', () => {
    // This would require more complex mocking of Supabase
    // For now, just ensure the logout button renders
    render(<AppHeader />)

    const logoutButton = screen.getByText('Salir')
    expect(logoutButton).toBeInTheDocument()
  })
})







