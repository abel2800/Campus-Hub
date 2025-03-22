import React, { useState } from 'react';
import { Dropdown, Menu, Avatar } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProfileDropdown = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleMenuClick = (e) => {
    switch (e.key) {
      case 'profile':
        navigate('/profile');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'logout':
        logout();
        navigate('/login');
        break;
      default:
        break;
    }
    setOpen(false);
  };

  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        My Profile
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        Settings
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} danger>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown 
      open={open}
      onOpenChange={setOpen}
      overlay={menu} 
      trigger={['click']} 
      placement="bottomRight" 
      arrow
    >
      <div 
        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setOpen(!open)}
      >
        <Avatar 
          src={user?.avatar} 
          icon={!user?.avatar && <UserOutlined />} 
          size="small"
          style={{ 
            backgroundColor: !user?.avatar ? '#1890ff' : undefined,
            cursor: 'pointer'
          }}
        />
      </div>
    </Dropdown>
  );
};

export default ProfileDropdown; 