import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigate, useParams } from 'react-router-dom';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { usersAPI } from '../services/api';

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
  role: yup
    .string()
    .oneOf(['user', 'manager', 'admin'], 'Invalid role')
    .required('Role is required'),
  status: yup
    .string()
    .oneOf(['active', 'inactive'], 'Invalid status')
    .required('Status is required'),
});

const EditUser = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(validationSchema),
  });

  // Fetch user data
  const {
    data: userData,
    isLoading,
    error,
  } = useQuery(
    ['user', id],
    () => usersAPI.getUserById(id),
    {
      enabled: !!id,
      refetchOnWindowFocus: false,
    }
  );

  // Update user mutation
  const updateUserMutation = useMutation(
    (data) => usersAPI.updateUser(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        queryClient.invalidateQueries(['user', id]);
        navigate('/users');
      },
    }
  );

  // Reset form when user data is loaded
  useEffect(() => {
    if (userData?.data) {
      reset({
        name: userData.data.name,
        email: userData.data.email,
        role: userData.data.role,
        status: userData.data.status,
      });
    }
  }, [userData, reset]);

  const onSubmit = (data) => {
    updateUserMutation.mutate(data);
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
        Error loading user: {error.message}
      </Alert>
    );
  }

  const user = userData?.data;

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/users')}
          sx={{ mr: 2 }}
        >
          Back to Users
        </Button>
        <Typography variant="h4">Edit User</Typography>
      </Box>

      <Card maxWidth="md">
        <CardContent>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Update the user information below.
          </Typography>

          {updateUserMutation.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {updateUserMutation.error.response?.data?.message || 'Error updating user'}
            </Alert>
          )}

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
                  disabled={updateUserMutation.isLoading}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  {...register('email')}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={updateUserMutation.isLoading}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    label="Role"
                    {...register('role')}
                    error={!!errors.role}
                    disabled={updateUserMutation.isLoading}
                  >
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="manager">Manager</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                  {errors.role && (
                    <Typography variant="caption" color="error">
                      {errors.role.message}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    {...register('status')}
                    error={!!errors.status}
                    disabled={updateUserMutation.isLoading}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                  {errors.status && (
                    <Typography variant="caption" color="error">
                      {errors.status.message}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            </Grid>

            {/* User Information */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                User Information:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>User ID:</strong> {user?.id}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Created:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Last Updated:</strong> {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Last Login:</strong> {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </Typography>
                </Grid>
                {user?.createdBy && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Created By:</strong> {user.createdBy.name} ({user.createdBy.email})
                    </Typography>
                  </Grid>
                )}
                {user?.updatedBy && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Last Updated By:</strong> {user.updatedBy.name} ({user.updatedBy.email})
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={updateUserMutation.isLoading}
                size="large"
              >
                {updateUserMutation.isLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  'Update User'
                )}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/users')}
                disabled={updateUserMutation.isLoading}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EditUser;
