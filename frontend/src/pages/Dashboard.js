import React from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();

  // Fetch user statistics (admin/manager only)
  const { data: stats, isLoading: statsLoading } = useQuery(
    'userStatistics',
    usersAPI.getUserStatistics,
    {
      enabled: user?.role === 'admin' || user?.role === 'manager',
      refetchOnWindowFocus: false,
    }
  );

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'manager':
        return 'warning';
      case 'user':
        return 'success';
      default:
        return 'default';
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 17) greeting = 'Good evening';

    return `${greeting}, ${user?.name}!`;
  };

  const getRoleBasedContent = () => {
    switch (user?.role) {
      case 'admin':
        return {
          title: 'Admin Dashboard',
          description: 'Manage users, roles, and system settings',
          features: [
            'Create and manage user accounts',
            'Assign roles and permissions',
            'View system statistics',
            'Monitor user activity',
            'Manage security settings',
          ],
        };
      case 'manager':
        return {
          title: 'Manager Dashboard',
          description: 'Manage team members and view reports',
          features: [
            'View user profiles',
            'Update user information',
            'View team statistics',
            'Monitor team activity',
          ],
        };
      case 'user':
        return {
          title: 'User Dashboard',
          description: 'Manage your profile and account settings',
          features: [
            'Update your profile information',
            'Change your password',
            'View your account details',
          ],
        };
      default:
        return {
          title: 'Dashboard',
          description: 'Welcome to User Management System',
          features: [],
        };
    }
  };

  const roleContent = getRoleBasedContent();

  if (statsLoading && (user?.role === 'admin' || user?.role === 'manager')) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Section */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          {getWelcomeMessage()}
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {roleContent.title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {roleContent.description}
        </Typography>
      </Box>

      {/* User Info Card */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar
                  sx={{ bgcolor: getRoleColor(user?.role), mr: 2 }}
                  size={56}
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">{user?.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.email}
                  </Typography>
                  <Chip
                    label={user?.role}
                    color={getRoleColor(user?.role)}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>
              <Box display="flex" alignItems="center" color="text.secondary">
                <AccessTimeIcon sx={{ mr: 1, fontSize: 16 }} />
                <Typography variant="caption">
                  Last login: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <List dense>
                {roleContent.features.map((feature, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <PersonIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={feature} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Statistics Section (Admin/Manager only) */}
      {(user?.role === 'admin' || user?.role === 'manager') && stats?.data && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <PeopleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary">
                {stats.data.totalUsers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Users
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
              <TrendingUpIcon sx={{ fontSize: 40, mb: 1, color: 'success.dark' }} />
              <Typography variant="h4" color="success.dark">
                {stats.data.totalActive}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Users
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
              <SecurityIcon sx={{ fontSize: 40, mb: 1, color: 'error.dark' }} />
              <Typography variant="h4" color="error.dark">
                {stats.data.totalInactive}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Inactive Users
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
              <EmailIcon sx={{ fontSize: 40, mb: 1, color: 'warning.dark' }} />
              <Typography variant="h4" color="warning.dark">
                {stats.data.byRole?.admin?.total || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Admin Users
              </Typography>
            </Paper>
          </Grid>

          {/* Role Distribution */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  User Distribution by Role
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(stats.data.byRole || {}).map(([role, data]) => (
                    <Grid item xs={12} md={4} key={role}>
                      <Paper sx={{ p: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                            {role}
                          </Typography>
                          <Chip
                            label={data.total}
                            color={getRoleColor(role)}
                            size="small"
                          />
                        </Box>
                        <Box display="flex" justifyContent="space-between" mt={1}>
                          <Typography variant="body2" color="success.main">
                            Active: {data.active}
                          </Typography>
                          <Typography variant="body2" color="error.main">
                            Inactive: {data.inactive}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Regular User Info */}
      {user?.role === 'user' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Account Information
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Account Status"
                      secondary={
                        <Chip
                          label="Active"
                          color="success"
                          size="small"
                        />
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Account Created"
                      secondary={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Last Updated"
                      secondary={user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Security Tips
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Use a strong password"
                      secondary="Include uppercase, lowercase, numbers, and special characters"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Keep your password secure"
                      secondary="Don't share your password with anyone"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Regular password updates"
                      secondary="Change your password periodically"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard;
