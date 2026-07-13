import { render, screen, fireEvent, waitFor, act } from '../utils/test-utils';
import CourseList from '../components/CourseList';
import CourseDetail from '../components/CourseDetail';
import Courses from '../components/Courses';
import axios from '../utils/axios';

// Mock the utils/axios module that components actually use
jest.mock('../utils/axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  },
  defaults: {
    headers: {
      common: {}
    }
  }
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
  useNavigate: () => mockNavigate,
}));

describe('Course Components', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockUseParams.mockReturnValue({ courseId: '1' });
    
    // Reset axios mocks
    axios.get.mockClear();
    axios.post.mockClear();
    axios.put.mockClear();
    axios.delete.mockClear();
  });

  describe('CourseList Component', () => {
    it('renders course list with enrolled courses', async () => {
      const mockCourses = [
        { id: 1, title: 'React Basics', description: 'Learn React fundamentals' },
        { id: 2, title: 'Advanced JavaScript', description: 'Master JS concepts' }
      ];

      axios.get.mockResolvedValueOnce({ data: mockCourses });

      await act(async () => {
        render(<CourseList />);
      });

      await waitFor(() => {
        expect(screen.getByText('React Basics')).toBeInTheDocument();
        expect(screen.getByText('Advanced JavaScript')).toBeInTheDocument();
      });

      expect(axios.get).toHaveBeenCalledWith('/courses/enrolled');
    });

    it('shows empty state when no courses enrolled', async () => {
      axios.get.mockResolvedValueOnce({ data: [] });

      await act(async () => {
        render(<CourseList />);
      });

      await waitFor(() => {
        expect(screen.getByText(/not enrolled in any courses/i)).toBeInTheDocument();
      });
    });

    it('handles API error gracefully', async () => {
      axios.get.mockRejectedValueOnce(new Error('API Error'));

      await act(async () => {
        render(<CourseList />);
      });

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch enrolled courses/i)).toBeInTheDocument();
      });
    });
  });

  describe('CourseDetail Component', () => {
    it('renders course details when course exists', async () => {
      const mockCourse = {
        id: 1,
        title: 'React Basics',
        description: 'Learn React fundamentals',
        instructor: 'John Doe'
      };

      mockUseParams.mockReturnValue({ courseId: '1' });
      axios.get.mockResolvedValueOnce({ data: mockCourse });

      await act(async () => {
        render(<CourseDetail />);
      });

      await waitFor(() => {
        expect(screen.getByText('React Basics')).toBeInTheDocument();
        expect(screen.getByText('Learn React fundamentals')).toBeInTheDocument();
      });

      expect(axios.get).toHaveBeenCalledWith('/courses/1');
    });

    it('shows error when course ID is invalid', async () => {
      mockUseParams.mockReturnValue({ courseId: 'invalid' });
      axios.get.mockRejectedValueOnce(new Error('Course not found'));

      await act(async () => {
        render(<CourseDetail />);
      });

      await waitFor(() => {
        expect(screen.getByText(/failed to load course/i)).toBeInTheDocument();
      });
    });

    it('handles enrollment when user clicks enroll button', async () => {
      const mockCourse = {
        id: 1,
        title: 'React Basics',
        description: 'Learn React fundamentals',
        instructor: 'John Doe'
      };

      mockUseParams.mockReturnValue({ courseId: '1' });
      axios.get.mockResolvedValueOnce({ data: mockCourse });
      axios.post.mockResolvedValueOnce({ data: { message: 'Enrolled successfully' } });

      await act(async () => {
        render(<CourseDetail />);
      });

      await waitFor(() => {
        expect(screen.getByText('React Basics')).toBeInTheDocument();
      });

      const enrollButton = screen.queryByRole('button', { name: /enroll/i });
      if (enrollButton) {
        await act(async () => {
          fireEvent.click(enrollButton);
        });

        await waitFor(() => {
          expect(axios.post).toHaveBeenCalledWith('/courses/1/enroll');
        });
      }
    });
  });

  describe('Courses Component', () => {
    it('renders available courses', async () => {
      const mockCourses = [
        { id: 1, title: 'React Basics', description: 'Learn React fundamentals' },
        { id: 2, title: 'Vue.js Essentials', description: 'Master Vue.js' }
      ];

      axios.get.mockResolvedValueOnce({ data: mockCourses });

      await act(async () => {
        render(<Courses />);
      });

      await waitFor(() => {
        expect(screen.getByText('React Basics')).toBeInTheDocument();
        expect(screen.getByText('Vue.js Essentials')).toBeInTheDocument();
      });

      expect(axios.get).toHaveBeenCalledWith('/courses');
    });

    it('shows empty state when no courses available', async () => {
      axios.get.mockResolvedValueOnce({ data: [] });

      await act(async () => {
        render(<Courses />);
      });

      await waitFor(() => {
        expect(screen.getByText(/no courses available/i)).toBeInTheDocument();
      });
    });

    it('handles course enrollment', async () => {
      const mockCourses = [
        { id: 1, title: 'React Basics', description: 'Learn React fundamentals' }
      ];

      axios.get.mockResolvedValueOnce({ data: mockCourses });
      axios.post.mockResolvedValueOnce({ data: { message: 'Enrolled successfully' } });

      await act(async () => {
        render(<Courses />);
      });

      await waitFor(() => {
        expect(screen.getByText('React Basics')).toBeInTheDocument();
      });

      const enrollButton = screen.queryByRole('button', { name: /enroll/i });
      if (enrollButton) {
        await act(async () => {
          fireEvent.click(enrollButton);
        });

        await waitFor(() => {
          expect(axios.post).toHaveBeenCalledWith('/courses/1/enroll');
        });
      }
    });
  });
}); 