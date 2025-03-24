import React from 'react';
import { Switch, Tooltip } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ style }) => {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <Tooltip title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
      <Switch
        checked={darkMode}
        onChange={toggleTheme}
        checkedChildren={<BulbOutlined />}
        unCheckedChildren={<BulbFilled />}
        style={{ background: darkMode ? '#1890ff' : undefined, ...style }}
      />
    </Tooltip>
  );
};

export default ThemeToggle; 