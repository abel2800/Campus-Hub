import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import LoginPage from '../components/LoginPage';
import CreateAccount from '../components/CreateAccount';
import ForgotPassword from '../components/auth/ForgotPassword';
import { AuthProvider } from '../contexts/AuthContext';

// Mock API calls
jest.mock('../services/api', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }))
}));

describe('Authentication Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login Component', () => {
    it('renders login form', () => {
      render(<LoginPage />);
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    });

    it('handles form submission', async () => {
      const mockApi = require('../services/api');
      mockApi.post.mockResolvedValue({ 
        data: { token: 'fake-token', username: 'testuser' } 
      });

      render(<LoginPage />);
      
      fireEvent.change(screen.getByPlaceholderText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText(/password/i), {
        target: { value: 'password123' },
      });
      
      fireEvent.click(screen.getByRole('button', { name: /log in/i }));
      
      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalled();
      });
    });
  });

  describe('Register Component', () => {
    it('renders registration form', () => {
      render(<CreateAccount />);
      expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('handles registration submission', async () => {
      const mockApi = require('../services/api');
      mockApi.post.mockResolvedValue({ 
        data: { message: 'Registration successful', token: 'fake-token' } 
      });

      render(<CreateAccount />);
      
      fireEvent.change(screen.getByPlaceholderText(/username/i), {
        target: { value: 'Test User' },
      });
      fireEvent.change(screen.getByPlaceholderText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText(/password/i), {
        target: { value: 'password123' },
      });
      
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));
      
      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalled();
      });
    });
  });

  describe('Forgot Password Component', () => {
    it('renders forgot password form', () => {
      render(<ForgotPassword />);
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });

    it('handles password reset request', async () => {
      render(<ForgotPassword />);
      
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'test@example.com' },
      });
      
      fireEvent.click(screen.getByTestId('submit-button'));
      
      await waitFor(() => {
        expect(screen.getByText(/password reset email sent successfully/i)).toBeInTheDocument();
      });
    });
  });
}); 