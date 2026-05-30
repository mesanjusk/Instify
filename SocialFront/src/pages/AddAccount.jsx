import React, { useState, useEffect } from 'react';
import apiClient from '../apiClient';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Save } from '@mui/icons-material';

export default function AddAccount() {
  const navigate = useNavigate();
  const [Account_name, setAccount_name] = useState('');
  const [Mobile_number, setMobile_number] = useState('');
  const [Account_group, setAccount_group] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const institute_uuid = localStorage.getItem('institute_uuid');

  useEffect(() => {
    apiClient.get(`/api/accountgroup/GetAccountgroupList`)
      .then(res => {
        if (res.data.success) {
          setAccount_group(res.data.result);
        }
      }).catch(err => {
        alert('Error fetching accounts');
        console.error(err);
      });
  }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      await apiClient.post(`/api/account/addAccount`, {
        Account_name,
        Mobile_number,
        Account_group: selectedGroup,
        institute_uuid: institute_uuid,
      })
        .then(res => {
          if (res.data == 'exist') {
            alert('Account already exists');
          } else if (res.data == 'notexist') {
            alert('Account added successfully');
            navigate('/home');
          }
        })
        .catch(e => {
          alert('wrong details');
          console.log(e);
        });
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 2 }}>
      <Card variant="outlined" sx={{ width: '100%', maxWidth: 480 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h5" fontWeight={700} mb={3}>Add Account</Typography>
          <Box component="form" onSubmit={submit}>
            <Stack spacing={2}>
              <TextField
                label="Account Name"
                value={Account_name}
                onChange={(e) => setAccount_name(e.target.value)}
                placeholder="Account Name"
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Mobile Number"
                type="number"
                value={Mobile_number}
                onChange={(e) => setMobile_number(e.target.value)}
                placeholder="Mobile Number"
                fullWidth
                size="small"
              />
              <FormControl fullWidth size="small" required>
                <InputLabel>Account Group</InputLabel>
                <Select
                  value={selectedGroup}
                  onChange={e => setSelectedGroup(e.target.value)}
                  label="Account Group"
                >
                  <MenuItem value="">Select Group</MenuItem>
                  {Account_group.map((g, idx) => (
                    <MenuItem key={idx} value={g.Account_group_uuid}>
                      {g.Account_group}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button type="submit" variant="contained" color="success" startIcon={<Save />} fullWidth>
                Submit
              </Button>
              <Button variant="outlined" color="error" fullWidth onClick={() => navigate('/home')}>
                Close
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
