import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Row, Col, Typography, Card, Carousel, Badge, Statistic, Space, Avatar } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  BookOutlined, 
  TeamOutlined, 
  TrophyOutlined, 
  RocketOutlined,
  CheckCircleOutlined,
  CommentOutlined,
  FileTextOutlined,
  VideoCameraOutlined
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import styled, { keyframes, css } from 'styled-components';

const { Title, Paragraph, Text } = Typography;

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

// Add new animations
const rotateIn = keyframes`
  from {
    opacity: 0;
    transform: rotate(-10deg) scale(0.9);
  }
  to {
    opacity: 1;
    transform: rotate(0) scale(1);
  }
`;

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
`;

const shine = keyframes`
  from {
    background-position: 200% center;
  }
  to {
    background-position: -200% center;
  }
`;

// Styled Components
const LandingContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
  overflow: hidden;
`;

const HeroSection = styled.div`
  padding: 60px 40px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80');
    background-size: cover;
    background-position: center;
    opacity: 0.1;
    z-index: -1;
  }
`;

const LogoText = styled(Title)`
  font-size: 4.5rem !important;
  font-weight: 800 !important;
  background: linear-gradient(45deg, #1890ff, #722ed1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 10px !important;
  animation: ${float} 3s ease-in-out infinite;
`;

const TagLine = styled(Paragraph)`
  font-size: 1.7rem !important;
  margin-bottom: 30px !important;
  max-width: 600px;
  color: #303030;
  animation: ${fadeIn} 1s ease-out;
`;

const FeatureCard = styled(Card)`
  height: 100%;
  border-radius: 12px !important;
  box-shadow: 0 10px 20px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  overflow: hidden;
  animation: ${fadeIn} 0.8s ease-out;
  animation-fill-mode: both;
  animation-delay: ${props => props.delay || '0s'};
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0,0,0,0.1);
  }
`;

const CTAButton = styled(Button)`
  height: 50px !important;
  font-size: 16px !important;
  border-radius: 8px !important;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  transition: all 0.3s ease !important;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.15);
  }
`;

const LoginCard = styled(Card)`
  border-radius: 16px !important;
  box-shadow: 0 15px 35px rgba(0,0,0,0.1) !important;
  overflow: hidden;
  animation: ${fadeIn} 1s ease-out;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  max-width: 450px;
  margin: 0 auto;
`;

const StatsCard = styled(Card)`
  text-align: center;
  border-radius: 12px;
  animation: ${pulse} 4s infinite ease-in-out;
  animation-delay: ${props => props.delay || '0s'};
  box-shadow: 0 5px 15px rgba(0,0,0,0.08);
  margin-bottom: 20px;
`;

const CarouselCard = styled(Card)`
  border-radius: 16px;
  overflow: hidden;
  margin: 20px 0;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
`;

const TestimonialCard = styled(Card)`
  margin: 10px;
  border-radius: 10px;
  position: relative;
  padding-top: 20px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
`;

const QuoteIcon = styled.div`
  font-size: 60px;
  position: absolute;
  top: 10px;
  right: 20px;
  opacity: 0.1;
  color: #1890ff;
`;

const FeatureIcon = styled.div`
  font-size: 36px;
  margin-bottom: 15px;
  color: #1890ff;
  transition: all 0.3s ease;
  
  ${FeatureCard}:hover & {
    transform: scale(1.2);
  }
`;

const AnimatedIcon = styled.div`
  animation: ${bounce} 2s ease infinite;
  display: inline-block;
  margin-right: 10px;
  font-size: 24px;
`;

const ShiningText = styled(Text)`
  background: linear-gradient(90deg, #1890ff, #722ed1, #1890ff);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${shine} 3s linear infinite;
  font-weight: bold !important;
  font-size: 18px !important;
`;

const RotatingCard = styled(FeatureCard)`
  animation: ${rotateIn} 0.7s ease-out;
  transition: all 0.5s ease;
  
  &:hover {
    transform: translateY(-5px) rotate(2deg);
  }
`;

const FloatingButton = styled(CTAButton)`
  position: relative;
  
  &:before {
    content: '';
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    border-radius: 12px;
    background: linear-gradient(90deg, #1890ff, #722ed1, #1890ff);
    background-size: 200% auto;
    z-index: -1;
    animation: ${shine} 3s linear infinite;
    opacity: 0.7;
    filter: blur(8px);
    transition: all 0.3s ease;
  }
  
  &:hover:before {
    opacity: 1;
    filter: blur(12px);
  }
`;

const PulsingFeatureIcon = styled(FeatureIcon)`
  animation: ${pulse} 2s infinite ease-in-out;
`;

// Replace the existing AnimatedIllustration component with a more professional one
const AnimatedIllustration = styled.div`
  margin: 30px auto;
  max-width: 100%;
  position: relative;
  height: 220px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  padding: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  overflow: hidden;
  
  .graduation-cap {
    position: absolute;
    width: 60px;
    height: 60px;
    background: url('https://cdn-icons-png.flaticon.com/512/1945/1945478.png') no-repeat;
    background-size: contain;
    animation: floatGradCap 5s infinite ease-in-out;
    top: 30px;
    left: 20%;
    z-index: 2;
  }
  
  .laptop {
    position: absolute;
    width: 90px;
    height: 90px;
    background: url('https://cdn-icons-png.flaticon.com/512/3659/3659899.png') no-repeat;
    background-size: contain;
    animation: typingAnimation 3s infinite ease-in-out;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1;
  }
  
  .books {
    position: absolute;
    width: 80px;
    height: 80px;
    background: url('https://cdn-icons-png.flaticon.com/512/3330/3330314.png') no-repeat;
    background-size: contain;
    animation: slideBooks 7s infinite ease-in-out;
    top: 40px;
    right: 20%;
  }
  
  .certificate {
    position: absolute;
    width: 70px;
    height: 70px;
    background: url('https://cdn-icons-png.flaticon.com/512/4185/4185148.png') no-repeat;
    background-size: contain;
    animation: fadeInOut 8s infinite ease-in-out;
    bottom: 40px;
    right: 15%;
    opacity: 0.9;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(24, 144, 255, 0.05) 0%, rgba(114, 46, 209, 0.05) 100%);
    z-index: 0;
  }
`;

const LandingPage = () => {
  const [loading, setLoading] = useState(false);
  const [animatedItems, setAnimatedItems] = useState([]);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Animation effect for staggered entrance
  useEffect(() => {
    const items = ['stats', 'features', 'testimonials'];
    let timeout;
    
    items.forEach((item, index) => {
      timeout = setTimeout(() => {
        setAnimatedItems(prev => [...prev, item]);
      }, index * 300);
    });
    
    return () => clearTimeout(timeout);
  }, []);

  // Add style to be applied through DOM - moved inside component
  useEffect(() => {
    // Create the keyframe animations first
    const shineKeyframes = `
      @keyframes shineAnimation {
        from {
          background-position: 200% center;
        }
        to {
          background-position: -200% center;
        }
      }
    `;
    
    const floatElementKeyframes = `
      @keyframes floatElementAnimation {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
        100% { transform: translateY(0px); }
      }
    `;
    
    const floatGradCapKeyframes = `
      @keyframes floatGradCap {
        0% { transform: translateY(0) rotate(0); opacity: 0.8; }
        25% { transform: translateY(-15px) rotate(5deg); opacity: 1; }
        50% { transform: translateY(0) rotate(0); opacity: 0.8; }
        75% { transform: translateY(-10px) rotate(-5deg); opacity: 1; }
        100% { transform: translateY(0) rotate(0); opacity: 0.8; }
      }
    `;
    
    const typingAnimationKeyframes = `
      @keyframes typingAnimation {
        0% { transform: translateX(-50%) scale(1); }
        50% { transform: translateX(-50%) scale(1.05); }
        100% { transform: translateX(-50%) scale(1); }
      }
    `;
    
    const slideBooksKeyframes = `
      @keyframes slideBooks {
        0% { transform: translateX(0) translateY(0); }
        25% { transform: translateX(-15px) translateY(5px); }
        50% { transform: translateX(0) translateY(15px); }
        75% { transform: translateX(15px) translateY(5px); }
        100% { transform: translateX(0) translateY(0); }
      }
    `;
    
    const fadeInOutKeyframes = `
      @keyframes fadeInOut {
        0% { opacity: 0.7; transform: scale(0.95); }
        50% { opacity: 1; transform: scale(1.05); }
        100% { opacity: 0.7; transform: scale(0.95); }
      }
    `;
    
    const style = document.createElement('style');
    style.innerHTML = `
      ${shineKeyframes}
      ${floatElementKeyframes}
      ${floatGradCapKeyframes}
      ${typingAnimationKeyframes}
      ${slideBooksKeyframes}
      ${fadeInOutKeyframes}
      
      .animated-title {
        position: relative;
        overflow: hidden;
        background: linear-gradient(45deg, #1890ff, #722ed1, #1890ff);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: shineAnimation 3s linear infinite;
      }
      
      .animated-input {
        transition: all 0.3s ease;
      }
      
      .animated-input:focus {
        transform: scale(1.02);
        box-shadow: 0 0 10px rgba(24, 144, 255, 0.3);
      }
      
      .ant-carousel .slick-slide {
        transition: all 0.5s ease;
      }
      
      .ant-carousel:hover .slick-slide {
        transform: scale(1.01);
      }
      
      .feature-item {
        transition: all 0.3s ease;
      }
      
      .feature-item:hover {
        transform: translateY(-5px);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const userWithRole = await login(values);
      
      // Check if login was successful and user has role
      if (userWithRole) {
        // Set autoLogin flag to true
        localStorage.setItem('autoLogin', 'true');
        
        // Check if user is a teacher and redirect accordingly
        if (userWithRole.role === 'teacher') {
          console.log('Teacher logged in, redirecting to teacher dashboard');
          message.success('Welcome back, Teacher!');
          
          // Use setTimeout to ensure message is shown before redirect
          setTimeout(() => {
            // Force a hard redirect to teacher home page
            window.location.href = '/teacher/home';
          }, 500);
        } else {
          console.log('Student logged in, redirecting to dashboard');
          message.success('Login successful!');
          navigate('/home');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LandingContainer>
      {/* Theme Toggle in the top right corner */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000 }}>
        <ThemeToggle />
      </div>
      
      <HeroSection>
        <Row gutter={[48, 48]} justify="space-between" align="middle">
        {/* Left side - Website Info */}
          <Col xs={24} lg={13}>
            <LogoText>Campus Hub</LogoText>
            <TagLine>
              Your all-in-one platform for academic success and campus connection
            </TagLine>
            
            {/* Replace stats with animated illustration */}
            <AnimatedIllustration>
              <div className="graduation-cap"></div>
              <div className="laptop"></div>
              <div className="books"></div>
              <div className="certificate"></div>
            </AnimatedIllustration>
            
            <CarouselCard>
              <Carousel autoplay effect="fade" dots={{ className: 'custom-carousel-dots' }}>
                <div>
                  <img 
                    src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                    alt="Students collaborating" 
                    style={{ width: '100%', height: '300px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <Title level={4} className="animated-title">Connect with Classmates</Title>
                    <Paragraph>Build your academic network and collaborate effectively</Paragraph>
                  </div>
                </div>
                      <div>
                  <img 
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                    alt="Study group" 
                    style={{ width: '100%', height: '300px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <Title level={4} className="animated-title">Access Course Content Anywhere</Title>
                    <Paragraph>Learn on your schedule, from any device</Paragraph>
                  </div>
                      </div>
                      <div>
                  <img 
                    src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                    alt="Students with digital devices" 
                    style={{ width: '100%', height: '300px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <Title level={4} className="animated-title">Track Your Progress</Title>
                    <Paragraph>Visualize your academic journey with detailed analytics</Paragraph>
                      </div>
          </div>
              </Carousel>
            </CarouselCard>
        </Col>

        {/* Right side - Login Form */}
          <Col xs={24} lg={11}>
            <LoginCard>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <Title level={2} style={{ marginBottom: '8px', color: '#1890ff' }} className="animated-title">
                  Welcome Back
            </Title>
                <Paragraph style={{ fontSize: '16px' }}>
                  Log in to continue your academic journey
                </Paragraph>
              </div>
              
            <Form
              name="login"
              onFinish={onFinish}
              autoComplete="off"
              layout="vertical"
                size="large"
            >
              <Form.Item
                name="email"
                rules={[{ required: true, message: 'Please input your email!' }]}
              >
                <Input
                    prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                  placeholder="Email"
                  size="large"
                    style={{ borderRadius: '8px', height: '50px' }}
                    className="animated-input"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Please input your password!' }]}
              >
                <Input.Password
                    prefix={<LockOutlined style={{ color: '#1890ff' }} />}
                  placeholder="Password"
                  size="large"
                    style={{ borderRadius: '8px', height: '50px' }}
                    className="animated-input"
                />
              </Form.Item>

              <Form.Item>
                  <FloatingButton type="primary" htmlType="submit" loading={loading} block>
                  Log in
                  </FloatingButton>
              </Form.Item>

              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <Text>New to Campus Hub?</Text>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <FloatingButton 
                    type="default" 
                    block 
                    onClick={() => navigate('/create-account')}
                    style={{ marginBottom: '16px' }}
                  >
                  Create Student Account
                  </FloatingButton>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                  <FloatingButton 
                    type="default" 
                    block 
                    onClick={() => navigate('/teacher-registration')}
                  >
                  Register as a Teacher
                  </FloatingButton>
              </div>
            </Form>
            </LoginCard>
          </Col>
        </Row>
      </HeroSection>

      {/* Features Section */}
      <div style={{ padding: '60px 40px', background: '#fff' }} data-section="features">
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <Badge.Ribbon text="New Features" color="#1890ff">
            <Title level={2} style={{ color: '#1890ff', position: 'relative', display: 'inline-block', padding: '0 30px' }} className="animated-title">
              Designed for Modern Learning
            </Title>
          </Badge.Ribbon>
          <Paragraph style={{ fontSize: '18px', maxWidth: '800px', margin: '20px auto' }}>
            Campus Hub combines social connectivity with powerful learning tools to create 
            the ultimate academic experience
          </Paragraph>
        </div>
        
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={8}>
            <RotatingCard delay="0.2s">
              <PulsingFeatureIcon>
                <VideoCameraOutlined />
              </PulsingFeatureIcon>
              <Title level={4}>Interactive Learning</Title>
              <Paragraph>
                Access video lectures, interactive quizzes, and engaging multimedia content that makes learning enjoyable.
              </Paragraph>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Track video progress</li>
                <li>Bookmark important moments</li>
                <li>Downloadable resources</li>
              </ul>
            </RotatingCard>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <RotatingCard delay="0.4s">
              <PulsingFeatureIcon>
                <TeamOutlined />
              </PulsingFeatureIcon>
              <Title level={4}>Social Collaboration</Title>
              <Paragraph>
                Connect with classmates, form study groups, and collaborate on projects through integrated tools.
              </Paragraph>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Real-time messaging</li>
                <li>Group forums</li>
                <li>Shared project spaces</li>
              </ul>
            </RotatingCard>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <RotatingCard delay="0.6s">
              <PulsingFeatureIcon>
                <RocketOutlined />
              </PulsingFeatureIcon>
              <Title level={4}>Progress Tracking</Title>
              <Paragraph>
                Visualize your academic journey with detailed analytics and progress metrics.
              </Paragraph>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Course completion tracking</li>
                <li>Performance analytics</li>
                <li>Study time optimization</li>
              </ul>
            </RotatingCard>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <RotatingCard delay="0.8s">
              <PulsingFeatureIcon>
                <FileTextOutlined />
              </PulsingFeatureIcon>
              <Title level={4}>Resource Library</Title>
              <Paragraph>
                Access a comprehensive library of academic resources tailored to your courses.
              </Paragraph>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Course materials</li>
                <li>Research papers</li>
                <li>Study guides</li>
              </ul>
            </RotatingCard>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <RotatingCard delay="1s">
              <PulsingFeatureIcon>
                <CommentOutlined />
              </PulsingFeatureIcon>
              <Title level={4}>Community Forums</Title>
              <Paragraph>
                Engage in discussions, ask questions, and participate in subject-specific forums.
              </Paragraph>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Topic-based discussions</li>
                <li>Q&A sections</li>
                <li>Expert responses</li>
              </ul>
            </RotatingCard>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <RotatingCard delay="1.2s">
              <PulsingFeatureIcon>
                <CheckCircleOutlined />
              </PulsingFeatureIcon>
              <Title level={4}>Assignment Management</Title>
              <Paragraph>
                Organize your assignments, set deadlines, and submit work - all in one place.
              </Paragraph>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Deadline reminders</li>
                <li>Submission tracking</li>
                <li>Feedback system</li>
              </ul>
            </RotatingCard>
        </Col>
      </Row>
    </div>

      {/* Call to Action */}
      <div style={{ padding: '60px 40px', background: '#1890ff', textAlign: 'center' }}>
        <Title level={2} style={{ color: 'white', marginBottom: '20px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }} className="animated-title">
          Ready to Transform Your Academic Experience?
        </Title>
        <Paragraph style={{ fontSize: '18px', color: 'white', marginBottom: '30px' }}>
          Join thousands of students and educators already using Campus Hub
        </Paragraph>
        <Space size="large">
          <FloatingButton 
            type="primary" 
            ghost 
            size="large"
            onClick={() => navigate('/create-account')}
            style={{ 
              height: '50px',
              borderColor: 'white',
              color: 'white'
            }}
          >
            Create Account
          </FloatingButton>
          <FloatingButton
            type="default"
            size="large"
            onClick={() => {
              const featuresSection = document.querySelector('[data-section="features"]');
              if (featuresSection) {
                featuresSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            style={{ 
              height: '50px',
              background: 'white',
              borderColor: 'white'
            }}
          >
            Learn More
          </FloatingButton>
        </Space>
      </div>

      {/* Footer with updated Contact Info */}
      <div style={{ padding: '40px', background: '#001529', color: 'white' }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Title level={3} style={{ color: 'white' }}>Campus Hub</Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.8)' }}>
              Connecting students and educators for a better learning experience.
            </Paragraph>
          </Col>
          <Col xs={24} md={8}>
            <Title level={4} style={{ color: 'white' }}>Quick Links</Title>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><a href="#" style={{ color: 'rgba(255,255,255,0.8)' }}>About Us</a></li>
              <li><a href="#" style={{ color: 'rgba(255,255,255,0.8)' }}>Features</a></li>
              <li><a href="#" style={{ color: 'rgba(255,255,255,0.8)' }}>Privacy Policy</a></li>
              <li><a href="#" style={{ color: 'rgba(255,255,255,0.8)' }}>Terms of Service</a></li>
            </ul>
          </Col>
          <Col xs={24} md={8}>
            <Title level={4} style={{ color: 'white' }}>Contact Us</Title>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ margin: '12px 0' }}>
                <ShiningText>WeChat:</ShiningText> <Text style={{ color: 'white' }}>black_gift</Text>
              </li>
              <li style={{ margin: '12px 0' }}>
                <ShiningText>Email:</ShiningText> <Text style={{ color: 'white' }}>absir28@gmail.com</Text>
              </li>
              <li style={{ margin: '12px 0' }}>
                <ShiningText>Phone:</ShiningText> <Text style={{ color: 'white' }}>+86 18691503400</Text>
              </li>
            </ul>
            <FloatingButton type="primary" ghost style={{ marginTop: '15px' }}>
              Contact Support
            </FloatingButton>
          </Col>
        </Row>
        <div style={{ textAlign: 'center', marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
          <Text style={{ color: 'rgba(255,255,255,0.6)' }}>
            © {new Date().getFullYear()} Campus Hub. All rights reserved.
          </Text>
        </div>
      </div>
    </LandingContainer>
  );
};

export default LandingPage;