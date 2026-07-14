import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Input, Avatar, Upload, Button, message, Spin, Empty, Divider, List, Tooltip, Badge, Popconfirm, Modal } from 'antd';
import { SendOutlined, PictureOutlined, SearchOutlined, UserAddOutlined, MailOutlined, UserOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../utils/axios';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { checkSensitiveContent } from '../utils/contentModeration';

const ChatContainer = styled.div`
  display: flex;
  height: calc(100vh - 64px);
  background-color: #f5f7f9;
`;

const ConversationsList = styled.div`
  width: 300px;
  border-right: 1px solid #e8e8e8;
  background-color: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const SearchContainer = styled.div`
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
  position: relative;
`;

const ChatsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ChatArea = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background-color: white;
`;

const MessageList = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: #f5f7f9;
`;

const InputArea = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  border-top: 1px solid #e8e8e8;
  background-color: white;
`;

const Message = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
  flex-direction: ${props => props.isSender ? 'row-reverse' : 'row'};
`;

const MessageContent = styled.div`
  background-color: ${props => props.isSender ? '#1890ff' : 'white'};
  color: ${props => props.isSender ? 'white' : 'inherit'};
  padding: 12px 16px;
  border-radius: 18px;
  max-width: 70%;
  word-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const SearchResultsContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: white;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
  max-height: 300px;
  overflow-y: auto;
`;

const ChatHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  background-color: white;
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e8e8e8;
`;

const Tab = styled.div`
  padding: 12px 16px;
  cursor: pointer;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  color: ${props => props.active ? '#1890ff' : 'inherit'};
  border-bottom: 2px solid ${props => props.active ? '#1890ff' : 'transparent'};
  transition: all 0.3s;
  
  &:hover {
    color: #1890ff;
  }
`;

// Add this new styled component for the delete button
const DeleteButton = styled.div`
  visibility: hidden;
  color: #ff4d4f;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(255, 77, 79, 0.1);
  }
`;

const ChatItem = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #f9f9f9;
  }
  
  &:hover ${DeleteButton} {
    visibility: visible;
  }
`;

const ChatPage = () => {
  const [recentChats, setRecentChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [friendsList, setFriendsList] = useState([]);
  const [activeTab, setActiveTab] = useState('chats');
  const [loadingFriends, setLoadingFriends] = useState(false);
  const messageListRef = useRef(null);
  const messagesEndRef = useRef(null);
  const searchContainerRef = useRef(null);
  const { socket, connected } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams(); // Get userId from URL params

  useEffect(() => {
    loadRecentChats();
    loadFriendsList();
    
    // Set up socket event listener for new messages
    if (socket) {
      socket.on('new_message', handleNewMessage);
      
      // Clean up event listener on unmount
      return () => {
        socket.off('new_message', handleNewMessage);
      };
    }
  }, [socket]);

  // Handle direct messaging from URL parameter
  useEffect(() => {
    if (userId) {
      loadUserInfo(userId);
    }
  }, [userId]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadUserInfo = async (userId) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/users/${userId}`);
      setSelectedFriend(response.data);
      loadMessageHistory(userId);
    } catch (error) {
      console.error('Error loading user info:', error);
      message.error('Failed to load user information');
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    if (selectedFriend && 
        (message.sender_id === selectedFriend.id || 
         message.receiver_id === selectedFriend.id)) {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    }
    // Refresh recent chats to show latest message
    loadRecentChats();
  };

  const loadRecentChats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/messages/recent');
      setRecentChats(response.data);
    } catch (error) {
      console.error('Error loading recent chats:', error);
      message.error('Failed to load recent chats');
    } finally {
      setLoading(false);
    }
  };

  const loadFriendsList = async () => {
    try {
      setLoadingFriends(true);
      const response = await api.get('/api/friends/list');
      setFriendsList(response.data);
    } catch (error) {
      console.error('Error loading friends list:', error);
      message.error('Failed to load friends list');
    } finally {
      setLoadingFriends(false);
    }
  };

  const loadMessageHistory = async (friendId) => {
    if (!friendId) {
      console.error('No friendId provided to loadMessageHistory');
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.get(`/api/messages/${friendId}`);
      
      if (response.data && Array.isArray(response.data)) {
      setMessages(response.data);
      scrollToBottom();
      
      // Join the chat room when loading message history
        if (socket && connected && friendId) {
          socket.emit('join_room', `chat_${friendId}`);
        }
      } else {
        // If we get an empty response or non-array, set empty messages
        setMessages([]);
        console.warn('No messages found or invalid response format');
      }
    } catch (error) {
      console.error('Error loading message history:', error);
      // Don't show error message if it's just that no messages exist yet
      if (error.response && error.response.status !== 404) {
      message.error('Failed to load message history');
      }
      // Set empty messages array on error
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    try {
      // Validate inputs
      if (!messageInput.trim() && !attachment) {
        message.error('Please enter a message or attach a file');
        return;
      }

      const sensitive = checkSensitiveContent(messageInput);
      if (sensitive.blocked) {
        message.error(sensitive.message);
        return;
      }
      
      if (!selectedFriend || !selectedFriend.id) {
        message.error('No recipient selected');
        return;
      }
      
      setLoading(true);
      
      // Clear input fields immediately for better UX
      const currentInput = messageInput;
      const currentAttachment = attachment;
      setMessageInput('');
      setAttachment(null);
      
      try {
        // Use the correct parameter names that match the backend controller
        const response = await api.post('/api/messages/send', {
          participantId: selectedFriend.id,
          content: currentInput
        });
        
        console.log('Message sent successfully:', response.data);
        
        if (response.data) {
          // Add the new message to the messages list
          setMessages(prevMessages => [...(Array.isArray(prevMessages) ? prevMessages : []), response.data]);
          
          // Scroll to bottom
          scrollToBottom();
          
          // Refresh recent chats
          loadRecentChats();
        } else {
          console.error('Invalid response format:', response.data);
          message.error('Failed to send message');
          // Restore input if sending failed
          setMessageInput(currentInput);
          setAttachment(currentAttachment);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        const apiMsg = error.response?.data?.message;
        message.error(apiMsg || 'Failed to send message. Please try again.');
        // Restore input if sending failed
        setMessageInput(currentInput);
        setAttachment(currentAttachment);
      }
    } catch (error) {
      console.error('Unexpected error in handleSendMessage:', error);
      message.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Handle typing indicators
  const handleTyping = () => {
    if (socket && connected && selectedFriend) {
      socket.emit('typing', { room: `chat_${selectedFriend.id}` });
    }
  };

  const handleStopTyping = () => {
    if (socket && connected && selectedFriend) {
      socket.emit('stop_typing', { room: `chat_${selectedFriend.id}` });
    }
  };

  // Start a conversation with a friend from search results
  const startConversation = async (friend) => {
    if (!friend || !friend.id) {
      message.error('Invalid friend data');
      return;
    }

    try {
      setLoading(true);
      setSelectedFriend(friend);
      setShowSearchResults(false);
      setSearchQuery('');
      
      // Update URL without triggering a full navigation
      navigate(`/chat/${friend.id}`, { replace: true });
      
      // Load message history
      await loadMessageHistory(friend.id);
      
    } catch (error) {
      console.error('Error starting conversation:', error);
      message.error('Failed to start conversation');
      // Navigate back to chat list on error
      navigate('/chat', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  // Create a new chat with specific error handling
  const createNewChatWithFriend = async (friendId) => {
    try {
      const response = await api.post('/api/messages/create', { participantId: friendId });
      
      if (response.data) {
        // Update messages with the initial message
        setMessages([response.data]);
        scrollToBottom();
        // Refresh recent chats to include the new chat
        loadRecentChats();
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      message.error('Failed to create chat with this user');
    }
  };

  // Revised version of the createNewChat function to avoid navigation issues
  const createNewChat = async (friendId) => {
    if (!friendId) {
      message.error('Invalid friend data');
      return;
    }
    
    try {
      setLoading(true);
      await createNewChatWithFriend(friendId);
      setActiveTab('chats');
    } catch (error) {
      console.error('Error creating chat:', error);
      message.error('Failed to create chat');
    } finally {
      setLoading(false);
    }
  };

  // Search for friends
  const handleSearch = async (value) => {
    setSearchQuery(value);
    
    if (!value.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    try {
      setSearchLoading(true);
      setShowSearchResults(true);
      const response = await api.get(`/api/users/search?query=${value}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching for friends:', error);
      message.error('Failed to search for friends');
    } finally {
      setSearchLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time only
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show full date
    return date.toLocaleDateString();
  };

  // Filter friends that are not in recent chats
  const getFriendsWithoutChats = () => {
    if (!friendsList || !Array.isArray(friendsList) || !recentChats || !Array.isArray(recentChats) || !user) {
      return [];
    }
    
    try {
      // Extract all friend IDs that have existing chats
      const chatFriendIds = recentChats
        .filter(chat => chat && (chat.sender_id !== undefined) && (chat.receiver || chat.sender))
        .map(chat => {
          if (!chat) return null;
          
          let friendId = null;
          if (chat.sender_id === user.id) {
            friendId = chat.receiver && chat.receiver.id;
          } else {
            friendId = chat.sender && chat.sender.id;
          }
          
          return friendId ? friendId.toString() : null;
        })
        .filter(id => id !== null);
      
      // Filter out friends that already have chats
      return friendsList
        .filter(friendship => friendship && friendship.friend && friendship.friend.id)
        .filter(friendship => {
          const friendId = friendship.friend.id.toString();
          return !chatFriendIds.includes(friendId);
        });
    } catch (error) {
      console.error('Error in getFriendsWithoutChats:', error);
      return [];
    }
  };

  const MessageList = () => {
    if (loading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%', 
          padding: '20px'
        }}>
          <Spin />
        </div>
      );
    }
    
    if (!selectedFriend) {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%', 
          padding: '20px'
        }}>
          <Empty description="Select a conversation to start chatting" />
        </div>
      );
    }
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%', 
          padding: '20px'
        }}>
          <Empty description="No messages yet. Start the conversation!" />
        </div>
      );
    }
    
    console.log('Rendering messages:', messages);
    
    return (
      <div style={{ 
        height: '100%', 
        overflow: 'auto', 
        padding: '16px'
      }}>
        {messages.map((message, index) => {
          if (!message) return null;
          
          // Check if we have valid message data
          if (!message.sender_id && !message.receiver_id) {
            console.error('Invalid message format:', message);
            return null;
          }
          
          const isCurrentUser = message.sender_id === user?.id;
          const messageUser = isCurrentUser ? message.sender : message.receiver;
          
          // Fallback values if sender/receiver details are missing
          const senderName = messageUser?.username || (isCurrentUser ? user?.username : selectedFriend?.username) || 'Unknown User';
          const senderAvatar = messageUser?.avatar || (isCurrentUser ? user?.avatar : selectedFriend?.avatar);
          
          return (
            <div 
              key={message.id || index}
              style={{ 
                display: 'flex',
                flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                marginBottom: '16px'
              }}
            >
              <Avatar 
                src={senderAvatar}
                icon={<UserOutlined />}
                style={{ 
                  marginLeft: isCurrentUser ? '12px' : '0',
                  marginRight: isCurrentUser ? '0' : '12px',
                  flexShrink: 0
                }}
              />
              <div
                style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: '18px',
                  backgroundColor: isCurrentUser ? '#1890ff' : '#f0f2f5',
                  color: isCurrentUser ? 'white' : 'rgba(0, 0, 0, 0.85)',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                  wordWrap: 'break-word'
                }}
              >
                <div style={{ marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                  {senderName}
                </div>
                <div>{message.content}</div>
                <div style={{ 
                  fontSize: '11px', 
                  color: isCurrentUser ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.45)',
                  marginTop: '4px', 
                  textAlign: 'right' 
                }}>
                  {formatTime(message.createdAt || message.created_at)}
                </div>
              </div>
            </div>
          );
        }).filter(Boolean)}
        <div ref={messagesEndRef} />
      </div>
    );
  };

  const getThumbnail = (course) => {
    if (!course) return null;
    
    if (course.thumbnail && course.thumbnail.startsWith('http')) {
      return course.thumbnail;
    } else if (course.thumbnail) {
      // If thumbnail exists but doesn't start with http, it's a relative path
      return `${process.env.REACT_APP_API_URL || ''}${course.thumbnail}`;
    }
    
    // Return a default thumbnail if none exists
    return '/default-course-image.jpg';
  };

  // Update the deleteChat function to handle different chat ID structures
  const deleteChat = async (chat, event) => {
    // Stop event propagation to prevent opening the chat
    event.stopPropagation();
    
    // Extract the chat ID - check for different possible structures
    const chatId = chat.id || chat.chatId || (chat.lastMessage && chat.lastMessage.id);
    
    if (!chatId) {
      message.error('Unable to delete chat: Chat ID not found');
      return;
    }
    
    try {
      await api.delete(`/api/messages/chat/${chatId}`);
      message.success('Chat deleted successfully');
      
      // Update the recentChats state by removing the deleted chat
      setRecentChats(prevChats => prevChats.filter(c => 
        (c.id !== chatId) && 
        (c.chatId !== chatId) && 
        (!c.lastMessage || c.lastMessage.id !== chatId)
      ));
      
      // If the deleted chat was selected, clear the selection
      if (selectedFriend && selectedFriend.id === chat.participant?.id) {
        setSelectedFriend(null);
        setMessages([]);
        navigate('/chat', { replace: true });
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      message.error('Failed to delete chat');
    }
  };

  return (
    <ChatContainer>
      <ConversationsList>
        <SearchContainer ref={searchContainerRef}>
          <Input
            placeholder="Search friends..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onClick={() => searchQuery.trim() && setShowSearchResults(true)}
            style={{ borderRadius: '20px' }}
          />
          
          {showSearchResults && (
            <SearchResultsContainer>
              {searchLoading ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <Spin />
                </div>
              ) : searchResults.length === 0 ? (
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE} 
                  description="No friends found" 
                  style={{ padding: '20px' }}
                />
              ) : (
                <List
                  dataSource={searchResults.filter(friend => friend !== null)}
                  renderItem={friend => (
                    <List.Item
                      onClick={() => friend.isFriend && startConversation(friend)}
                      style={{ 
                        padding: '10px 16px', 
                        cursor: friend.isFriend ? 'pointer' : 'default',
                        transition: 'background-color 0.3s',
                        ':hover': { backgroundColor: friend.isFriend ? '#f5f5f5' : 'transparent' }
                      }}
                    >
                      <List.Item.Meta
                        avatar={<Avatar src={friend.avatar} />}
                        title={friend.username}
                        description={friend.department || 'No department'}
                      />
                      {friend.isFriend ? (
                        <Button 
                          type="primary" 
                          size="small" 
                          icon={<SendOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            startConversation(friend);
                          }}
                        >
                          Message
                        </Button>
                      ) : friend.requestSent ? (
                        <Badge status="processing" text="Request Sent" />
                      ) : (
                        <Tooltip title="Add friend first to message">
                          <Button 
                            size="small" 
                            icon={<UserAddOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/friends`);
                            }}
                          >
                            Add Friend
                          </Button>
                        </Tooltip>
                      )}
                    </List.Item>
                  )}
                />
              )}
            </SearchResultsContainer>
          )}
        </SearchContainer>
        
        <TabsContainer>
          <Tab 
            active={activeTab === 'chats'} 
            onClick={() => setActiveTab('chats')}
          >
            Chats
          </Tab>
          <Tab 
            active={activeTab === 'friends'} 
            onClick={() => setActiveTab('friends')}
          >
            Friends
          </Tab>
        </TabsContainer>
        
        <ChatsContainer>
          {activeTab === 'chats' ? (
            loading && recentChats.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <Spin />
              </div>
            ) : recentChats.length === 0 ? (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE} 
                description="No conversations yet" 
                style={{ padding: '40px 0' }}
              />
            ) : (
              <div>
                {recentChats
                  .filter(chat => {
                    // Make sure the chat has valid participant data
                    return chat && chat.participant && (chat.content || chat.lastMessage?.content);
                  })
                  .map(chat => {
                    const friend = chat.participant;
                    
                    if (!friend || !friend.id) {
                      return null;
                    }
                    
                    const isSelected = selectedFriend?.id === friend.id;
                    const lastMessage = chat.content || chat.lastMessage?.content || 'Start a conversation';
                    const messageTime = chat.created_at || chat.createdAt || chat.lastMessage?.createdAt;
                    
                    return (
                      <ChatItem 
                        key={chat.id || `chat-${friend.id}`}
                        style={{ 
                          backgroundColor: isSelected ? '#e6f7ff' : 'white',
                        }}
                        onClick={() => {
                          setSelectedFriend(friend);
                          loadMessageHistory(friend.id);
                          navigate(`/chat/${friend.id}`, { replace: true });
                        }}
                      >
                        <Badge dot={chat.unread > 0} offset={[-2, 2]} color="#1890ff">
                          <Avatar 
                            src={friend.avatar} 
                            icon={!friend.avatar && <UserOutlined />} 
                            style={{ marginRight: 12 }}
                          />
                        </Badge>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            fontWeight: chat.unread > 0 ? 'bold' : 'normal',
                            display: 'flex', 
                            justifyContent: 'space-between'
                          }}>
                            <span style={{ 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap' 
                            }}>
                              {friend.username || friend.name}
                            </span>
                            <small style={{ color: '#999', fontSize: '0.85em' }}>
                              {messageTime ? formatTime(new Date(messageTime)) : ''}
                            </small>
                          </div>
                          <div style={{ 
                            color: '#999', 
                            fontSize: '0.9em',
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                            maxWidth: '200px'
                          }}>
                            {lastMessage}
                          </div>
                        </div>
                        <Popconfirm
                          title="Delete Chat"
                          description="Are you sure you want to delete this conversation? This action cannot be undone."
                          onConfirm={(e) => deleteChat(chat, e)}
                          okText="Delete"
                          cancelText="Cancel"
                          placement="left"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DeleteButton>
                            <DeleteOutlined />
                          </DeleteButton>
                        </Popconfirm>
                      </ChatItem>
                    );
                  })}
              </div>
            )
          ) : (
            loadingFriends ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <Spin />
              </div>
            ) : (
              (friendsList && Array.isArray(friendsList) && friendsList.length > 0) ? (
                friendsList
                  .filter(friend => {
                    // Make sure we're dealing with valid friend objects
                    if (!friend) return false;
                    
                    // Check if friend is a direct object or needs to be accessed from a property
                    const friendData = friend.friend || friend;
                    return friendData && friendData.id;
                  })
                  .map(friend => {
                    // Handle different friend object structures
                    const friendData = friend.friend || friend;
                    
                    return (
                      <div 
                        key={friendData.id} 
                        onClick={() => startConversation(friendData)}
                        style={{ 
                          padding: '12px 16px', 
                          borderBottom: '1px solid #f0f0f0',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'background-color 0.3s'
                        }}
                      >
                        <Avatar 
                          src={friendData.avatar} 
                          size={40}
                          style={{ marginRight: '12px', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {friendData.username || 'Unknown User'}
                          </div>
                          <div style={{ 
                            fontSize: '13px', 
                            color: '#8c8c8c',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {friendData.department || 'Start a conversation'}
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <Empty 
                  description="No friends available" 
                  style={{ padding: '40px 0' }}
                />
              )
            )
          )}
        </ChatsContainer>
      </ConversationsList>

      <ChatArea>
        {selectedFriend ? (
          <>
            <ChatHeader>
              <Avatar 
                src={selectedFriend.avatar} 
                size={40}
                style={{ marginRight: '12px' }}
              />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                  {selectedFriend.username}
                </div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  {selectedFriend.department || 'No department'}
                </div>
              </div>
            </ChatHeader>
            
            <MessageList />

            <InputArea>
              <Upload
                beforeUpload={(file) => {
                  setAttachment(file);
                  return false;
                }}
                showUploadList={false}
              >
                <Button 
                  icon={<PictureOutlined />} 
                  style={{ marginRight: '8px' }}
                  shape="circle"
                />
              </Upload>
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onPressEnter={handleSendMessage}
                onFocus={handleTyping}
                onBlur={handleStopTyping}
                placeholder="Type a message..."
                style={{ 
                  marginRight: '8px',
                  borderRadius: '20px',
                  padding: '8px 16px'
                }}
              />
              <Button 
                type="primary" 
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                shape="circle"
              />
            </InputArea>
          </>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%', 
            color: '#8c8c8c',
            padding: '0 20px',
            textAlign: 'center'
          }}>
            <Empty 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={null}
              style={{ marginBottom: '20px' }}
            />
            <h3>Welcome to Chat</h3>
            <p>Select a conversation from the left or search for a friend to start messaging</p>
          </div>
        )}
      </ChatArea>
    </ChatContainer>
  );
};

export default ChatPage;   