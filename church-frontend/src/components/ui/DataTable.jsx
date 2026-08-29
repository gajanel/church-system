/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
/**
 * DataTable.jsx — Corporate Dense Data Table Component
 * 
 * Standardizes all data tables across the system with:
 * - Integrated filter bar (search + selects)
 * - Zebra striping
 * - Compact rows
 * - Consistent action column
 * - Empty/loading states
 */
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, TextField, InputAdornment, CircularProgress
} from "@mui/material";
import { SearchOutlined } from "@mui/icons-material";
import styles from "./DataTable.module.css";

/**
 * @param {Object}   props
 * @param {string[]} props.columns       — Column header labels
 * @param {any[]}    props.rows          — Row data (passed to renderRow)
 * @param {Function} props.renderRow     — (row, index) => <TableRow>
 * @param {string}   [props.search]      — Controlled search value
 * @param {Function} [props.onSearch]    — Search change handler
 * @param {string}   [props.searchPlaceholder]
 * @param {any[]}    [props.filters]     — Array of { label, value, onChange, options:[{value,label}] }
 * @param {any[]}    [props.toolbarRight] — Extra elements on the right of toolbar
 * @param {boolean}  [props.loading]
 * @param {string}   [props.emptyText]
 * @param {number}   [props.colSpan]     — For empty state colspan
 */
export default function DataTable({
  columns,
  rows,
  renderRow,
  search,
  onSearch,
  searchPlaceholder = "Buscar...",
  filters = [],
  toolbarRight = [],
  loading = false,
  emptyText = "No se encontraron registros.",
  colSpan,
}) {
  const span = colSpan ?? columns.length;

  return (
    <div className={styles.wrapper}>
      {/* ── Filter Bar ── */}
      {(onSearch || filters.length > 0 || toolbarRight.length > 0) && (
        <div className={styles.filterBar}>
          <div className={styles.filterLeft}>
            {onSearch && (
              <TextField
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                size="small"
                sx={{ 
                  width: 280, bgcolor: "background.paper",
                  '& .MuiOutlinedInput-root': {
                    transition: 'all 0.2s ease',
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b82f6',
                      borderWidth: '1px',
                      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.15)',
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined sx={{ fontSize: 16, color: "text.disabled" }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
            {filters.map((f, i) => (
              <select
                key={i}
                className={styles.filterSelect}
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                aria-label={f.label}
              >
                <option value="">{f.label}: Todos</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ))}
          </div>
          <div className={styles.filterRight}>
            {toolbarRight}
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <TableContainer component={Paper} elevation={0} className={styles.tableContainer}>
        <Table size="small" className={styles.table} sx={{ '& .MuiTableCell-root': { padding: '6px 12px', fontSize: '0.8125rem', borderBottom: '1px solid #e5e7eb' } }}>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight:600, color:"#374151", bgcolor:"#f9fafb" } }}>
              {columns.map((col, i) => (
                <TableCell
                  key={i}
                  align={typeof col === "object" ? col.align : "left"}
                  sx={{ width: typeof col === "object" ? col.width : undefined }}
                >
                  {typeof col === "object" ? col.label : col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={span} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={span} align="center" sx={{ py: 6, color: "text.secondary", fontSize: 13 }}>
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, i) => renderRow(row, i))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
