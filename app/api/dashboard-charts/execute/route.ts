import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/postgres/client';
import type { DashboardChart } from '@/lib/db';
import { buildSafeColumnName } from '@/lib/helpers/query-helpers';

interface DateRange {
  from?: string;
  to?: string;
}

/**
 * POST /api/dashboard-charts/execute
 * Execute queries for dashboard charts and return formatted data for visualization
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionString, charts, dateRange } = body;

    if (!connectionString) {
      return NextResponse.json(
        { error: 'Connection string is required' },
        { status: 400 }
      );
    }

    if (!charts || !Array.isArray(charts)) {
      return NextResponse.json(
        { error: 'Charts array is required' },
        { status: 400 }
      );
    }

    // Execute queries for each chart
    const results = await Promise.all(
      (charts as DashboardChart[]).map(async (chart) => {
        try {
          // Helper function to build WHERE clause with date filter
          const buildDateFilter = (fromDate: string | undefined, toDate: string | undefined, baseQuery: string, baseParams: unknown[] = []) => {
            if (!chart.dateColumn || (!fromDate && !toDate)) {
              return { query: baseQuery, params: baseParams };
            }
            
            const conditions: string[] = [];
            const params = [...baseParams];
            let paramIndex = params.length + 1;
            
            // Use safe column name to preserve case sensitivity
            const safeDateColumn = buildSafeColumnName(chart.dateColumn);
            
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
              
              // Check if query already has WHERE clause
              const hasWhere = /\bWHERE\b/i.test(baseQuery);
              
              if (hasWhere) {
                // Add to existing WHERE clause
                return { query: `${baseQuery} AND ${whereClause}`, params };
              } else {
                // Find where to insert WHERE clause (before ORDER BY, GROUP BY, LIMIT, etc.)
                // Use regex to find the position before these clauses
                const orderByMatch = baseQuery.match(/\s+(ORDER\s+BY|GROUP\s+BY|LIMIT|OFFSET)\s+/i);
                
                if (orderByMatch && orderByMatch.index !== undefined) {
                  // Insert WHERE before ORDER BY/GROUP BY/LIMIT
                  const beforeClause = baseQuery.substring(0, orderByMatch.index);
                  const afterClause = baseQuery.substring(orderByMatch.index);
                  return { query: `${beforeClause} WHERE ${whereClause} ${afterClause}`, params };
                } else {
                  // No ORDER BY/GROUP BY/LIMIT, just append WHERE
                  return { query: `${baseQuery} WHERE ${whereClause}`, params };
                }
              }
            }
            
            return { query: baseQuery, params };
          };
          
          const dateRangeFilter = dateRange as DateRange | undefined;
          
          // Execute query with date filter if applicable
          const queryResult = buildDateFilter(
            dateRangeFilter?.from,
            dateRangeFilter?.to,
            chart.query
          );
          
          const result = await executeQuery(
            connectionString,
            queryResult.query,
            queryResult.params.length > 0 ? queryResult.params : undefined
          );
          
          if (!result || result.length === 0) {
            return {
              chartId: chart.id,
              data: [],
              success: true,
            };
          }

          // Format data for chart visualization
          const formattedData = result.map((row: any) => {
            const dataPoint: any = {};
            
            // Extract X-axis value
            if (chart.xAxisColumn && row[chart.xAxisColumn] !== undefined) {
              dataPoint[chart.xAxisColumn] = row[chart.xAxisColumn];
            } else if (Object.keys(row).length > 0) {
              // Fallback to first column if xAxisColumn not found
              const firstKey = Object.keys(row)[0];
              dataPoint[firstKey] = row[firstKey];
            }
            
            // Extract Y-axis value
            if (chart.yAxisColumn && row[chart.yAxisColumn] !== undefined) {
              const value = row[chart.yAxisColumn];
              dataPoint[chart.yAxisColumn] = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
            } else if (Object.keys(row).length > 1) {
              // Fallback to second column if yAxisColumn not found
              const keys = Object.keys(row);
              const secondKey = keys[1];
              const value = row[secondKey];
              dataPoint[secondKey] = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
            }
            
            // Extract series value if present
            if (chart.seriesColumn && row[chart.seriesColumn] !== undefined) {
              dataPoint[chart.seriesColumn] = row[chart.seriesColumn];
            }
            
            return dataPoint;
          });
          
          return {
            chartId: chart.id,
            data: formattedData,
            success: true,
          };
        } catch (error: any) {
          console.error(`Error executing query for chart ${chart.id}:`, error);
          
          // Extract user-friendly error message
          let errorMessage = 'Query execution failed';
          
          if (error.message) {
            const pgError = error.message;
            const errorCode = error.code;
            
            if (errorCode === '42P01') {
              errorMessage = 'Table does not exist';
            } else if (errorCode === '42703') {
              errorMessage = 'Column does not exist';
            } else if (errorCode === '42601') {
              errorMessage = 'SQL syntax error. Please check your query.';
            } else if (errorCode === '42501') {
              errorMessage = 'Permission denied. Check your database user privileges.';
            } else {
              errorMessage = pgError.length > 150 
                ? pgError.substring(0, 147) + '...' 
                : pgError;
            }
          }
          
          return {
            chartId: chart.id,
            data: [],
            error: errorMessage,
            success: false,
          };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Error executing dashboard chart queries:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute queries' },
      { status: 500 }
    );
  }
}

