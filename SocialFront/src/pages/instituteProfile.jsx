import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import BASE_URL from '../config';
import { useApp } from '../context/AppContext';
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Avatar,
  Divider,
} from '@mui/material';
import { Save, Business } from '@mui/icons-material';

const InstituteProfile = () => {
  const { institute, setInstitute } = useApp();
  const [data, setData] = useState(null);

  const [logoPreview, setLogoPreview] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState('');
  const [faviconFile, setFaviconFile] = useState(null);

  const instituteUUID = institute?.institute_uuid;

  useEffect(() => {
    if (instituteUUID) fetchProfile();
  }, [instituteUUID]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/institute/${instituteUUID}`);
      const result = res.data.result;
      setData(result);
      setLogoPreview(result.institute_logo || '');
      setFaviconPreview(result.theme_favicon || '');
    } catch (err) {
      toast.error('Failed to load profile');
      console.error(err);
    }
  };

  const handleChange = (field) => (e) => {
    setData({ ...data, [field]: e.target.value });
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return null;
    const formData = new FormData();
    formData.append('file', logoFile);
    try {
      const res = await axios.post(`${BASE_URL}/api/upload`, formData);
      return res.data.url;
    } catch (err) {
      toast.error('Logo upload failed');
      console.error(err);
      return null;
    }
  };

  const handleFaviconUpload = async () => {
    if (!faviconFile) return null;
    const formData = new FormData();
    formData.append('file', faviconFile);
    try {
      const res = await axios.post(`${BASE_URL}/api/upload`, formData);
      return res.data.url;
    } catch (err) {
      toast.error('Favicon upload failed');
      console.error(err);
      return null;
    }
  };

  const handleSave = async () => {
    if (!data || !instituteUUID) return;
    if (!window.confirm('Are you sure you want to save these changes?')) return;

    try {
      let logoUrl = logoPreview;
      let faviconUrl = faviconPreview;

      if (logoFile) {
        const uploaded = await handleLogoUpload();
        if (!uploaded) return;
        logoUrl = uploaded;
      }

      if (faviconFile) {
        const uploaded = await handleFaviconUpload();
        if (!uploaded) return;
        faviconUrl = uploaded;
      }

      const updated = {
        ...data,
        institute_logo: logoUrl,
        theme_color: data.theme_color || '#5b5b5b',
        theme_logo: logoUrl,
        theme_favicon: faviconUrl,
      };

      await axios.put(`${BASE_URL}/api/institute/update/${instituteUUID}`, updated);
      toast.success('Profile updated');
      fetchProfile();

      // Update theme, favicon, title, localStorage, Context
      document.documentElement.style.setProperty('--theme-color', updated.theme_color);

      document.title = `${updated.institute_title || 'Instify'} | Instify`;

      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = updated.theme_favicon || '/icon.svg';

      localStorage.setItem('institute_title', updated.institute_title);
      localStorage.setItem('theme_color', updated.theme_color);
      localStorage.setItem('favicon', updated.theme_favicon);
      localStorage.setItem('logo', updated.institute_logo);

      setInstitute((prev) => ({
        ...prev,
        institute_title: updated.institute_title,
        theme_color: updated.theme_color,
        institute_logo: updated.institute_logo,
        theme_favicon: updated.theme_favicon,
      }));
    } catch (err) {
      toast.error('Update failed');
      console.error(err);
    }
  };

  if (!data) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Business color="primary" sx={{ fontSize: 28 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>Institute Profile</Typography>
          <Typography variant="body2" color="text.secondary">Manage your institute settings and branding</Typography>
        </Box>
      </Stack>

      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="subtitle1" fontWeight={600} mb={2}>Basic Information</Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
              mb: 3,
            }}
          >
            <TextField
              label="Institute Title"
              value={data.institute_title || ''}
              onChange={handleChange('institute_title')}
              fullWidth
              size="small"
            />
            <TextField
              label="Institute Type"
              value={data.institute_type || ''}
              onChange={handleChange('institute_type')}
              fullWidth
              size="small"
            />
            <TextField
              label="Center Code"
              value={data.center_code || ''}
              onChange={handleChange('center_code')}
              fullWidth
              size="small"
            />
            <TextField
              label="Call Number"
              value={data.institute_call_number || ''}
              onChange={handleChange('institute_call_number')}
              fullWidth
              size="small"
            />
            <TextField
              label="Center Head Name"
              value={data.center_head_name || ''}
              onChange={handleChange('center_head_name')}
              fullWidth
              size="small"
            />
            <TextField
              label="Email"
              type="email"
              value={data.email || ''}
              onChange={handleChange('email')}
              fullWidth
              size="small"
            />
            <TextField
              label="Address"
              value={data.address || ''}
              onChange={handleChange('address')}
              fullWidth
              size="small"
              sx={{ gridColumn: { sm: 'span 2' } }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight={600} mb={2}>Branding</Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
            {/* Theme Color */}
            <Box>
              <Typography variant="body2" fontWeight={500} mb={1}>Theme Color</Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  component="input"
                  type="color"
                  value={data.theme_color || '#5b5b5b'}
                  onChange={handleChange('theme_color')}
                  sx={{
                    width: 48,
                    height: 40,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    cursor: 'pointer',
                    p: 0.5,
                  }}
                />
                <Typography variant="body2" color="text.secondary">{data.theme_color || '#5b5b5b'}</Typography>
              </Stack>
            </Box>

            {/* Institute Logo */}
            <Box>
              <Typography variant="body2" fontWeight={500} mb={1}>Institute Logo</Typography>
              <Button variant="outlined" component="label" size="small">
                Choose Logo
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setLogoFile(file);
                    setLogoPreview(URL.createObjectURL(file));
                  }}
                />
              </Button>
              {logoPreview && (
                <Box mt={1}>
                  <Avatar
                    src={logoPreview}
                    alt="Logo"
                    variant="rounded"
                    sx={{ width: 80, height: 80, border: '1px solid', borderColor: 'divider' }}
                  />
                </Box>
              )}
            </Box>

            {/* Favicon */}
            <Box>
              <Typography variant="body2" fontWeight={500} mb={1}>Favicon</Typography>
              <Button variant="outlined" component="label" size="small">
                Choose Favicon
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setFaviconFile(file);
                    setFaviconPreview(URL.createObjectURL(file));
                  }}
                />
              </Button>
              {faviconPreview && (
                <Box mt={1}>
                  <Avatar
                    src={faviconPreview}
                    alt="Favicon"
                    variant="rounded"
                    sx={{ width: 40, height: 40, border: '1px solid', borderColor: 'divider' }}
                  />
                </Box>
              )}
            </Box>
          </Box>

          <Box mt={3}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              size="large"
            >
              Save Changes
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InstituteProfile;
