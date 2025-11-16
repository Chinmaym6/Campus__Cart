import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../Navbar';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderNavbar = () => {
  return render(
    <BrowserRouter>
      <Navbar />
    </BrowserRouter>
  );
};

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the logo', () => {
    localStorageMock.getItem.mockReturnValue(null);
    renderNavbar();

    expect(screen.getByText('Campus Cart')).toBeInTheDocument();
  });

  it('shows login and register links when not logged in', () => {
    localStorageMock.getItem.mockReturnValue(null);
    renderNavbar();

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('shows dashboard and profile when logged in', () => {
    localStorageMock.getItem
      .mockReturnValueOnce('fakeToken')
      .mockReturnValueOnce(JSON.stringify({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      }));

    renderNavbar();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('👤')).toBeInTheDocument();
  });

  it('opens and closes profile dropdown', async () => {
    localStorageMock.getItem
      .mockReturnValueOnce('fakeToken')
      .mockReturnValueOnce(JSON.stringify({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      }));

    renderNavbar();

    const profileButton = screen.getByText('👤');
    fireEvent.click(profileButton);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('View Profile')).toBeInTheDocument();
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    // Click outside to close
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('handles logout correctly', async () => {
    localStorageMock.getItem
      .mockReturnValueOnce('fakeToken')
      .mockReturnValueOnce(JSON.stringify({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      }));

    renderNavbar();

    const profileButton = screen.getByText('👤');
    fireEvent.click(profileButton);

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});