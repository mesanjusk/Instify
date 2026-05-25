import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
} from '@mui/material';
import { CurrencyRupee, CalendarToday } from '@mui/icons-material';
import apiClient from '../apiClient';

const Fees = () => {
  const location = useLocation();
  const filterBy = location.state?.filterBy;

  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFees = async () => {
      const institute_uuid = localStorage.getItem('institute_uuid');
      const todayStr = new Date().toLocaleDateString('en-CA');

      try {
        const { data } = await apiClient.get('/api/fees', {
          params: { institute_uuid, date: todayStr },
        });
        setFees(data || []);
      } catch (err) {
        console.error('Error fetching fees:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFees();
  }, [filterBy]);

  const totalAmount = fees.reduce((sum, fee) => {
    return sum + (fee.installmentPlan || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
  }, 0);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Page Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Today's Fee Collection
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
        {!loading && fees.length > 0 && (
          <Card sx={{ bgcolor: '#1a7a4a', color: 'white', minWidth: 160 }}>
            <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>Total Collected</Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <CurrencyRupee sx={{ fontSize: 18 }} />
                <Typography variant="h6" fontWeight={700}>{totalAmount.toLocaleString('en-IN')}</Typography>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>

      {/* Content */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress sx={{ color: '#1a7a4a' }} />
            <Typography color="text.secondary">Loading fee collections...</Typography>
          </Stack>
        </Box>
      ) : fees.length === 0 ? (
        <Card>
          <CardContent>
            <Box display="flex" flexDirection="column" alignItems="center" py={4} gap={1}>
              <CurrencyRupee sx={{ fontSize: 48, color: 'text.disabled' }} />
              <Typography variant="h6" color="text.secondary">No fee collections today</Typography>
              <Typography variant="body2" color="text.disabled">
                Fee collections for today will appear here
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto', borderRadius: 2, boxShadow: 1 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50', whiteSpace: 'nowrap' }}>
                  Student Name
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50', whiteSpace: 'nowrap' }}>
                  Admission ID
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50', whiteSpace: 'nowrap' }}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <CalendarToday sx={{ fontSize: 14 }} />
                    <span>Due Date</span>
                  </Stack>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50', whiteSpace: 'nowrap' }}>
                  Amount
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fees.map((fee, idx) =>
                fee.installmentPlan.map((plan, i) => (
                  <TableRow
                    key={`${idx}-${i}`}
                    hover
                    sx={{ '&:last-child td': { borderBottom: 0 } }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {fee.studentName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={fee.admissionId}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(plan.dueDate).toLocaleDateString('en-IN')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ color: '#10b981' }}
                      >
                        ₹{Number(plan.amount).toLocaleString('en-IN')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default Fees;
