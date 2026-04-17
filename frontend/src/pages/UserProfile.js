import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Avatar,
} from '@mui/material';
import { Person as PersonIcon, Email as EmailIcon, AccessTime as AccessTimeIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Validation schema
const validationSchema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
});

const UserProfile = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch user profile
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery(
    'userProfile',
    usersAPI.getOwnProfile,
    {
      refetchOnWindowFocus: false,
    }
  );

  // Update profile mutation
  const updateProfileMutation = useMutation(usersAPI.updateOwnProfile, {
    onSuccess: () => {
      queryClient.invalidateQueries('userProfile');
      setEditMode(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  // Reset form when profile data is loaded
  React.useEffect(() => {
    if (profile?.data) {
      reset({
        name: profile.data.name,
        email: profile.data.email,
      });
    }
  }, [profile, reset]);

  const onSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  const handleCancel = () => {
    reset({
      name: profile?.data?.name || '',
      email: profile?.data?.email || '',
    });
    setEditMode(false);
  };

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

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Error loading profile: {error.message}
      </Alert>
    );
  }

  const userProfile = profile?.data;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: getRoleColor(userProfile?.role),
                    mb: 2,
                    fontSize: '2rem',
                  }}
                >
                  {userProfile?.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h6">{userProfile?.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {userProfile?.email}
                </Typography>
                <Chip
                  label={userProfile?.role}
                  color={getRoleColor(userProfile?.role)}
                  size="small"
                  sx={{ mb: 2 }}
                />
                <Chip
                  label={userProfile?.status}
                  color={userProfile?.status === 'active' ? 'success' : 'error'}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <List dense>
                <ListItem>
                  <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <ListItemText
                    primary="User ID"
                    secondary={userProfile?.id}
                  />
                </ListItem>
                <ListItem>
                  <AccessTimeIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <ListItemText
                    primary="Account Created"
                    secondary={
                      userProfile?.createdAt
                        ? format(new Date(userProfile.createdAt), 'MMMM dd, yyyy')
                        : 'N/A'
                    }
                  />
                </ListItem>
                <ListItem>
                  <AccessTimeIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <ListItemText
                    primary="Last Updated"
                    secondary={
                      userProfile?.updatedAt
                        ? format(new Date(userProfile.updatedAt), 'MMMM dd, yyyy')
                        : 'N/A'
                    }
                  />
                </ListItem>
                {userProfile?.lastLogin && (
                  <ListItem>
                    <AccessTimeIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <ListItemText
                      primary="Last Login"
                      secondary={format(new Date(userProfile.lastLogin), 'MMMM dd, yyyy HH:mm')}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Edit Profile Form */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">Profile Settings</Typography>
                {!editMode && (
                  <Button
                    variant="outlined"
                    onClick={() => setEditMode(true)}
                  >
                    Edit Profile
                  </Button>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              {!editMode ? (
                // View Mode
                <Box>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={userProfile?.name || ''}
                        InputProps={{
                          readOnly: true,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        value={userProfile?.email || ''}
                        InputProps={{
                          readOnly: true,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Role"
                        value={userProfile?.role || ''}
                        InputProps={{
                          readOnly: true,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Status"
                        value={userProfile?.status || ''}
                        InputProps={{
                          readOnly: true,
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                // Edit Mode
                <Box
                  component="form"
                  onSubmit={handleSubmit(onSubmit)}
                >
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        {...register('name')}
                        error={!!errors.name}
                        helperText={errors.name?.message}
                        disabled={updateProfileMutation.isLoading}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        {...register('email')}
                        error={!!errors.email}
                        helperText={errors.email?.message}
                        disabled={updateProfileMutation.isLoading}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Role"
                        value={userProfile?.role || ''}
                        InputProps={{
                          readOnly: true,
                        }}
                        helperText="Role cannot be changed"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Status"
                        value={userProfile?.status || ''}
                        InputProps={{
                          readOnly: true,
                        }}
                        helperText="Status cannot be changed"
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={updateProfileMutation.isLoading}
                    >
                      {updateProfileMutation.isLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleCancel}
                      disabled={updateProfileMutation.isLoading}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserProfile;
