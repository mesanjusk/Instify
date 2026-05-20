import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import BASE_URL from '../config';
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  TextField,
  Button,
} from '@mui/material';
import { Save } from '@mui/icons-material';

export default function AddAccountGroup() {
  const navigate = useNavigate();
  const [Account_group, setAccount_Group] = useState('');

  async function submit(e) {
    e.preventDefault();
    try {
      await axios.post(`${BASE_URL}/api/accountgroup/addAccountgroup`, {
        Account_group,
      })
        .then(res => {
          if (res.data == 'exist') {
            alert('Group already exists');
          } else if (res.data == 'notexist') {
            alert('Group added successfully');
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
          <Typography variant="h5" fontWeight={700} mb={3}>Add Account Group</Typography>
          <Box component="form" onSubmit={submit}>
            <Stack spacing={2}>
              <TextField
                label="Account Group"
                autoComplete="off"
                value={Account_group}
                onChange={(e) => setAccount_Group(e.target.value)}
                placeholder="Account Group"
                required
                fullWidth
                size="small"
              />
              <Button type="submit" variant="contained" color="success" startIcon={<Save />} fullWidth>
                Submit
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
