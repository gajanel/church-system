/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { Skeleton, Box, Grid } from "@mui/material";

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <Box sx={{ width: '100%', mt: 2 }}>
    {[...Array(rows)].map((_, i) => (
      <Box key={i} sx={{ display: 'flex', gap: 2, mb: 1, p: 1, borderBottom: '1px solid var(--border)' }}>
        {[...Array(cols)].map((_, j) => (
          <Skeleton key={j} variant="text" width={`${100/cols}%`} height={30} />
        ))}
      </Box>
    ))}
  </Box>
);

export const CardSkeleton = ({ count = 6 }) => (
  <Grid container spacing={3}>
    {[...Array(count)].map((_, i) => (
      <Grid item xs={12} sm={6} md={4} key={i}>
        <Box sx={{ p: 2, bgcolor: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Skeleton variant="circular" width={50} height={50} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="80%" height={24} />
              <Skeleton variant="text" width="60%" height={16} />
            </Box>
          </Box>
          <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 'var(--radius-md)' }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Skeleton variant="circular" width={30} height={30} />
            <Skeleton variant="circular" width={30} height={30} />
            <Skeleton variant="circular" width={30} height={30} />
          </Box>
        </Box>
      </Grid>
    ))}
  </Grid>
);

export const DashboardSkeleton = () => (
  <Box sx={{ p: 3 }}>
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {[...Array(5)].map((_, i) => (
        <Grid item xs={12} sm={6} md={2.4} key={i}>
          <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 'var(--radius-lg)' }} />
        </Grid>
      ))}
    </Grid>
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 'var(--radius-lg)' }} />
      </Grid>
      <Grid item xs={12} md={4}>
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 'var(--radius-lg)' }} />
      </Grid>
    </Grid>
  </Box>
);
