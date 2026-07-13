// Mock API service
const mockApi = {
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn(),
    },
    response: {
      use: jest.fn(),
      eject: jest.fn(),
    },
  },
  defaults: {
    headers: {
      common: {}
    }
  }
};

export default mockApi;

export const postService = {
  getPosts: jest.fn(() => Promise.resolve([])),
  createPost: jest.fn(() => Promise.resolve({})),
  likePost: jest.fn(() => Promise.resolve({})),
  unlikePost: jest.fn(() => Promise.resolve({})),
  getComments: jest.fn(() => Promise.resolve([]))
};

export const messageService = {
  getConversations: jest.fn(() => Promise.resolve([])),
  getMessages: jest.fn(() => Promise.resolve([])),
  sendMessage: jest.fn(() => Promise.resolve({}))
};

export const userService = {
  updateProfile: jest.fn(() => Promise.resolve({})),
  updateAvatar: jest.fn(() => Promise.resolve({})),
  getFriendSuggestions: jest.fn(() => Promise.resolve([]))
}; 