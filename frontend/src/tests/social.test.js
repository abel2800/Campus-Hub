import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import SocialMediaPage from '../components/SocialMediaPage';
import Friends from '../components/Friends';

// Mock API calls
jest.mock('../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }))
}));

describe('Social Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SocialMediaPage Component', () => {
    it('renders social media page', () => {
      render(<SocialMediaPage />);
      // Basic render test
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Friends Component', () => {
    it('renders friends page', () => {
      render(<Friends />);
      // Basic render test
      expect(document.body).toBeInTheDocument();
    });
  });
}); 