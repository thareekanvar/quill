import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/postgres/client';
import type { DashboardCard } from '@/lib/db';
import { buildSafeColumnName } from '@/lib/helpers/query-helpers';
import { 
  startOfDay, 
  endOfDay, 
  subDays, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  differenceInDays
} from 'date-fns';

interface DateRange {
  from?: string;
  to?: string;
}

/**
 * POST /api/dashboard-cards/execute
 * Execute queries for dashboard cards and return results with automatic trend calculation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionString, cards, dateRange } = body;

    if (!connectionString) {
      return NextResponse.json(
        { error: 'Connection string is required' },
        { status: 400 }
      );
    }

    if (!cards || !Array.isArray(cards)) {
      return NextResponse.json(
        { error: 'Cards array is required' },
        { status: 400 }
      );
    }

    // Execute queries for each card
    const results = await Promise.all(
      (cards as DashboardCard[]).map(async (card) => {
        try {
          // Helper function to build WHERE clause with date filter
          const buildDateFilter = (fromDate: string | undefined, toDate: string | undefined, baseQuery: string, baseParams: unknown[] = []) => {
            if (!card.dateColumn || (!fromDate && !toDate)) {
              return { query: baseQuery, params: baseParams };
            }
            
            const conditions: string[] = [];
            const params = [...baseParams];
            let paramIndex = params.length + 1;
            
            // Use safe column name to preserve case sensitivity
            const safeDateColumn = buildSafeColumnName(card.dateColumn);
            
            if (fromDate) {
              conditions.push(`${safeDateColumn} >= $${paramIndex}::timestamp`);
              params.push(fromDate);
              paramIndex++;
            }
            
            if (toDate) {
              const endDate = new Date(toDate);
              endDate.setHours(23, 59, 59, 999);
              conditions.push(`${safeDateColumn} <= $${paramIndex}::timestamp`);
              params.push(endDate.toISOString());
              paramIndex++;
            }
            
            if (conditions.length > 0) {
              const whereClause = conditions.join(' AND ');
              const upperQuery = baseQuery.toUpperCase().trim();
              
              if (upperQuery.includes('WHERE')) {
                return { query: `${baseQuery} AND ${whereClause}`, params };
              } else {
                return { query: `${baseQuery} WHERE ${whereClause}`, params };
              }
            }
            
            return { query: baseQuery, params };
          };
          
          const dateRangeFilter = dateRange as DateRange | undefined;
          
          // Calculate previous period for trend comparison
          let previousPeriodRange: { from?: string; to?: string } | undefined;
          
          if (card.dateColumn && dateRangeFilter && dateRangeFilter.from && dateRangeFilter.to) {
            const fromDate = new Date(dateRangeFilter.from);
            const toDate = new Date(dateRangeFilter.to);
            const daysDiff = differenceInDays(toDate, fromDate);
            
            // Calculate previous period based on duration
            if (daysDiff === 0) {
              // Today - compare with yesterday
              const yesterday = subDays(fromDate, 1);
              previousPeriodRange = {
                from: startOfDay(yesterday).toISOString(),
                to: endOfDay(yesterday).toISOString(),
              };
            } else if (daysDiff <= 7) {
              // Week range - compare with previous week
              const prevWeekStart = subDays(startOfWeek(fromDate, { weekStartsOn: 1 }), 7);
              const prevWeekEnd = subDays(endOfWeek(fromDate, { weekStartsOn: 1 }), 7);
              previousPeriodRange = {
                from: startOfDay(prevWeekStart).toISOString(),
                to: endOfDay(prevWeekEnd).toISOString(),
              };
            } else if (daysDiff <= 31) {
              // Month range - compare with previous month
              const prevMonthStart = subDays(startOfMonth(fromDate), 1);
              const prevMonthStart2 = startOfMonth(prevMonthStart);
              const prevMonthEnd = endOfMonth(prevMonthStart);
              previousPeriodRange = {
                from: startOfDay(prevMonthStart2).toISOString(),
                to: endOfDay(prevMonthEnd).toISOString(),
              };
            } else {
              // Year or custom range - compare with previous period of same duration
              previousPeriodRange = {
                from: new Date(fromDate.getTime() - (toDate.getTime() - fromDate.getTime())).toISOString(),
                to: fromDate.toISOString(),
              };
            }
          }
          
          // Execute current period query
          const currentQueryResult = buildDateFilter(
            dateRangeFilter?.from,
            dateRangeFilter?.to,
            card.query
          );
          const currentResult = await executeQuery(
            connectionString,
            currentQueryResult.query,
            currentQueryResult.params.length > 0 ? currentQueryResult.params : undefined
          );
          
          // Execute previous period query for trend calculation
          let previousValue: number | null = null;
          if (previousPeriodRange && card.dateColumn) {
            const previousQueryResult = buildDateFilter(
              previousPeriodRange.from,
              previousPeriodRange.to,
              card.query
            );
            try {
              const previousResult = await executeQuery(
                connectionString,
                previousQueryResult.query,
                previousQueryResult.params.length > 0 ? previousQueryResult.params : undefined
              );
              
              if (previousResult && previousResult.length > 0) {
                const prevRow = previousResult[0];
                if (card.valueColumn && prevRow[card.valueColumn] !== undefined) {
                  previousValue = typeof prevRow[card.valueColumn] === 'number' 
                    ? prevRow[card.valueColumn] 
                    : parseFloat(String(prevRow[card.valueColumn])) || 0;
                } else if (Object.keys(prevRow).length > 0) {
                  const firstKey = Object.keys(prevRow)[0];
                  previousValue = typeof prevRow[firstKey] === 'number'
                    ? prevRow[firstKey]
                    : parseFloat(String(prevRow[firstKey])) || 0;
                }
              }
            } catch (error) {
              // If previous period query fails, just continue without trend
              console.warn(`Failed to calculate trend for card ${card.id}:`, error);
            }
          }
          
          // Extract value from result
          let value: string | number = 'N/A';
          let currentNumericValue: number | null = null;
          
          if (currentResult && currentResult.length > 0) {
            const firstRow = currentResult[0];
            
            // Extract main value
            if (card.valueColumn && firstRow[card.valueColumn] !== undefined) {
              value = firstRow[card.valueColumn];
              currentNumericValue = typeof value === 'number' ? value : parseFloat(String(value)) || null;
            } else if (Object.keys(firstRow).length > 0) {
              const firstKey = Object.keys(firstRow)[0];
              value = firstRow[firstKey];
              currentNumericValue = typeof value === 'number' ? value : parseFloat(String(value)) || null;
            }
          }
          
          // Calculate trend
          let trendType: 'up' | 'down' | 'neutral' = 'neutral';
          let trendValue: string | undefined;
          
          if (currentNumericValue !== null && previousValue !== null && previousValue !== 0) {
            const change = currentNumericValue - previousValue;
            const percentChange = (change / previousValue) * 100;
            
            if (percentChange > 0) {
              trendType = 'up';
            } else if (percentChange < 0) {
              trendType = 'down';
            }
            
            trendValue = `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}%`;
          } else if (currentNumericValue !== null && previousValue === 0) {
            trendType = 'up';
            trendValue = '+100%';
          } else if (currentNumericValue === 0 && previousValue !== null && previousValue !== 0) {
            trendType = 'down';
            trendValue = '-100%';
          }
          
          // Format value
          if (typeof value === 'number') {
            value = value.toLocaleString();
          } else {
            value = String(value);
          }
          
          return {
            cardId: card.id,
            value,
            trendValue,
            trendType,
            success: true,
          };
        } catch (error: any) {
          console.error(`Error executing query for card ${card.id}:`, error);
          
          // Extract user-friendly error message from PostgreSQL error
          let errorMessage = 'Query execution failed';
          
          if (error.message) {
            const pgError = error.message;
            const errorCode = error.code;
            
            // Handle PostgreSQL error codes
            if (errorCode === '42P01') {
              // undefined_table - relation does not exist
              const match = pgError.match(/relation\s+"?([^"]+)"?\s+does not exist/i);
              if (match && match[1]) {
                errorMessage = `Table "${match[1]}" does not exist`;
              } else {
                errorMessage = 'Table does not exist';
              }
            } else if (errorCode === '42703') {
              // undefined_column - column does not exist
              const match = pgError.match(/column\s+"?([^"]+)"?\s+does not exist/i);
              if (match && match[1]) {
                errorMessage = `Column "${match[1]}" does not exist`;
              } else {
                errorMessage = 'Column does not exist';
              }
            } else if (errorCode === '42601') {
              // syntax_error
              errorMessage = 'SQL syntax error. Please check your query.';
            } else if (errorCode === '42501') {
              // insufficient_privilege
              errorMessage = 'Permission denied. Check your database user privileges.';
            } else if (pgError.includes('does not exist')) {
              // Fallback for "does not exist" errors
              const relationMatch = pgError.match(/relation\s+"?([^"]+)"?\s+does not exist/i);
              const columnMatch = pgError.match(/column\s+"?([^"]+)"?\s+does not exist/i);
              
              if (relationMatch && relationMatch[1]) {
                errorMessage = `Table "${relationMatch[1]}" does not exist`;
              } else if (columnMatch && columnMatch[1]) {
                errorMessage = `Column "${columnMatch[1]}" does not exist`;
              } else {
                errorMessage = pgError;
              }
            } else if (pgError.includes('syntax error')) {
              errorMessage = 'SQL syntax error. Please check your query.';
            } else if (pgError.includes('permission denied')) {
              errorMessage = 'Permission denied. Check your database user privileges.';
            } else {
              // Use the error message as-is, but truncate if too long
              errorMessage = pgError.length > 150 
                ? pgError.substring(0, 147) + '...' 
                : pgError;
            }
          }
          
          return {
            cardId: card.id,
            value: 'Error',
            error: errorMessage,
            success: false,
          };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Error executing dashboard card queries:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute queries' },
      { status: 500 }
    );
  }
}
