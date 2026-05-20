import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import BASE_URL from '../config';
import { formatDisplayDate } from '../utils/dateUtils';
import {
  Box,
  Stack,
  Typography,
  Button,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Delete, Business } from '@mui/icons-material';

const Institutes = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const [institutes, setInstitutes] = useState([]);

  useEffect(() => {
    if (user && user.role !== 'owner' && user.role !== 'super_admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchInstitutes();
  }, []);

  const fetchInstitutes = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/institute/GetOrganizList`);
      if (res.data?.success) {
        setInstitutes(res.data.result);
      } else {
        toast.error('No institutes found');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch institutes');
    }
  };

  const handleDelete = async (uuid) => {
    if (!window.confirm('Delete this institute and all related data?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/institute/${uuid}`);
      toast.success('Institute deleted');
      fetchInstitutes();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Business color="primary" sx={{ fontSize: 28 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>Manage Institutes</Typography>
          <Typography variant="body2" color="text.secondary">View and manage all registered institutes</Typography>
        </Box>
      </Stack>

      {/* Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: '70vh' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Center Code</strong></TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Plan</strong></TableCell>
              <TableCell><strong>Start Date</strong></TableCell>
              <TableCell><strong>Expiry</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {institutes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No institutes found
                </TableCell>
              </TableRow>
            ) : (
              institutes.map((inst) => (
                <TableRow key={inst.institute_uuid || inst._id} hover>
                  <TableCell>{inst.institute_title}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{inst.center_code}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Chip label={inst.plan_type || 'trial'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{inst.start_date ? formatDisplayDate(inst.start_date) : '-'}</TableCell>
                  <TableCell>{inst.expiry_date ? formatDisplayDate(inst.expiry_date) : '-'}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(inst.institute_uuid || inst._id)}
                      aria-label="Delete"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Institutes;
