/**
 * Analytics Controller
 * Calculates KPIs, Trends, Breakdowns, and orchestrates Python Analytics & ML Modules
 */

const db = require('../db');
const { callAnalytics } = require('../analyticsClient');

/**
 * Helper to build parameterized SQL WHERE clause based on filters
 */
function buildFilterClause(query, paramOffset = 1) {
  const conditions = [];
  const params = [];
  let index = paramOffset;

  if (query.startDate) {
    conditions.push(`sale_date >= $${index++}`);
    params.push(query.startDate);
  }
  if (query.endDate) {
    conditions.push(`sale_date <= $${index++}`);
    params.push(query.endDate);
  }
  if (query.region && query.region !== 'All') {
    conditions.push(`region = $${index++}`);
    params.push(query.region);
  }
  if (query.category && query.category !== 'All') {
    conditions.push(`category = $${index++}`);
    params.push(query.category);
  }

  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereSql, params, nextIndex: index };
}

/**
 * 1. KPI Summary
 * Total Revenue, Total Orders, Units Sold, AOV, and Period-over-Period Growth
 */
async function getKpis(req, res, next) {
  try {
    const { whereSql, params } = buildFilterClause(req.query);

    // Current period metrics
    const currentSql = `
      SELECT 
        COALESCE(SUM(revenue), 0) AS total_revenue,
        COUNT(DISTINCT transaction_id) AS total_orders,
        COALESCE(SUM(quantity), 0) AS total_units,
        MIN(sale_date) AS min_date,
        MAX(sale_date) AS max_date
      FROM sales_transactions
      ${whereSql};
    `;
    const curResult = await db.query(currentSql, params);
    const row = curResult.rows[0];

    const totalRevenue = parseFloat(row.total_revenue);
    const totalOrders = parseInt(row.total_orders, 10);
    const totalUnits = parseInt(row.total_units, 10);
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0.0;

    // Previous equivalent period growth calculation
    let growthPercent = 0.0;
    let priorRevenue = 0.0;

    if (row.min_date && row.max_date) {
      const minDate = new Date(row.min_date);
      const maxDate = new Date(row.max_date);
      const diffMs = maxDate.getTime() - minDate.getTime();
      const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);

      const priorEnd = new Date(minDate.getTime() - 24 * 60 * 60 * 1000);
      const priorStart = new Date(priorEnd.getTime() - (diffDays - 1) * 24 * 60 * 60 * 1000);

      const priorStartStr = priorStart.toISOString().split('T')[0];
      const priorEndStr = priorEnd.toISOString().split('T')[0];

      // Prior period query (matching same region/category filters)
      const priorParams = [priorStartStr, priorEndStr];
      let priorConditions = ['sale_date >= $1', 'sale_date <= $2'];
      let pIdx = 3;

      if (req.query.region && req.query.region !== 'All') {
        priorConditions.push(`region = $${pIdx++}`);
        priorParams.push(req.query.region);
      }
      if (req.query.category && req.query.category !== 'All') {
        priorConditions.push(`category = $${pIdx++}`);
        priorParams.push(req.query.category);
      }

      const priorSql = `
        SELECT COALESCE(SUM(revenue), 0) AS prior_revenue
        FROM sales_transactions
        WHERE ${priorConditions.join(' AND ')};
      `;
      const priorRes = await db.query(priorSql, priorParams);
      priorRevenue = parseFloat(priorRes.rows[0].prior_revenue);

      if (priorRevenue > 0) {
        growthPercent = ((totalRevenue - priorRevenue) / priorRevenue) * 100;
      } else if (totalRevenue > 0) {
        growthPercent = 100.0;
      }
    }

    res.json({
      status: 'SUCCESS',
      kpis: {
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        total_units: totalUnits,
        average_order_value: parseFloat(aov.toFixed(2)),
        revenue_growth_percent: parseFloat(growthPercent.toFixed(2)),
        prior_period_revenue: priorRevenue,
        currency: 'INR',
        currency_symbol: '₹',
        date_range: {
          start: row.min_date ? row.min_date.toISOString().split('T')[0] : null,
          end: row.max_date ? row.max_date.toISOString().split('T')[0] : null,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 2. Sales Trends (Daily Aggregated Series)
 */
async function getTrends(req, res, next) {
  try {
    const { whereSql, params } = buildFilterClause(req.query);
    const sql = `
      SELECT 
        TO_CHAR(sale_date, 'YYYY-MM-DD') AS date,
        COALESCE(SUM(revenue), 0) AS revenue,
        COUNT(DISTINCT transaction_id) AS orders,
        COALESCE(SUM(quantity), 0) AS units
      FROM sales_transactions
      ${whereSql}
      GROUP BY sale_date
      ORDER BY sale_date ASC;
    `;
    const result = await db.query(sql, params);
    const trends = result.rows.map((r) => ({
      date: r.date,
      revenue: parseFloat(parseFloat(r.revenue).toFixed(2)),
      orders: parseInt(r.orders, 10),
      units: parseInt(r.units, 10),
    }));

    res.json({
      status: 'SUCCESS',
      count: trends.length,
      trends,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 3. Category Breakdown
 */
async function getCategories(req, res, next) {
  try {
    const { whereSql, params } = buildFilterClause(req.query);
    const sql = `
      SELECT 
        category,
        COALESCE(SUM(revenue), 0) AS revenue,
        COUNT(DISTINCT transaction_id) AS orders,
        COALESCE(SUM(quantity), 0) AS units
      FROM sales_transactions
      ${whereSql}
      GROUP BY category
      ORDER BY revenue DESC;
    `;
    const result = await db.query(sql, params);
    const totalRev = result.rows.reduce((sum, r) => sum + parseFloat(r.revenue), 0);

    const categories = result.rows.map((r) => {
      const rev = parseFloat(r.revenue);
      return {
        category: r.category,
        revenue: parseFloat(rev.toFixed(2)),
        orders: parseInt(r.orders, 10),
        units: parseInt(r.units, 10),
        share_percent: totalRev > 0 ? parseFloat(((rev / totalRev) * 100).toFixed(2)) : 0.0,
      };
    });

    res.json({
      status: 'SUCCESS',
      total_revenue: totalRev,
      categories,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 4. Regional Breakdown
 */
async function getRegions(req, res, next) {
  try {
    const { whereSql, params } = buildFilterClause(req.query);
    const sql = `
      SELECT 
        region,
        COALESCE(SUM(revenue), 0) AS revenue,
        COUNT(DISTINCT transaction_id) AS orders,
        COALESCE(SUM(quantity), 0) AS units
      FROM sales_transactions
      ${whereSql}
      GROUP BY region
      ORDER BY revenue DESC;
    `;
    const result = await db.query(sql, params);
    const totalRev = result.rows.reduce((sum, r) => sum + parseFloat(r.revenue), 0);

    const regions = result.rows.map((r) => {
      const rev = parseFloat(r.revenue);
      return {
        region: r.region,
        revenue: parseFloat(rev.toFixed(2)),
        orders: parseInt(r.orders, 10),
        units: parseInt(r.units, 10),
        share_percent: totalRev > 0 ? parseFloat(((rev / totalRev) * 100).toFixed(2)) : 0.0,
      };
    });

    res.json({
      status: 'SUCCESS',
      total_revenue: totalRev,
      regions,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 5. Top Performing Products
 */
async function getTopProducts(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
    const { whereSql, params, nextIndex } = buildFilterClause(req.query);

    const sql = `
      SELECT 
        p.product_id,
        p.name,
        p.category,
        p.unit_price,
        COALESCE(SUM(s.revenue), 0) AS revenue,
        COALESCE(SUM(s.quantity), 0) AS units_sold,
        COUNT(DISTINCT s.transaction_id) AS orders_count
      FROM sales_transactions s
      JOIN products p ON s.product_id = p.product_id
      ${whereSql}
      GROUP BY p.product_id, p.name, p.category, p.unit_price
      ORDER BY revenue DESC
      LIMIT $${nextIndex};
    `;
    params.push(limit);

    const result = await db.query(sql, params);
    const products = result.rows.map((r) => ({
      product_id: r.product_id,
      name: r.name,
      category: r.category,
      unit_price: parseFloat(r.unit_price),
      revenue: parseFloat(parseFloat(r.revenue).toFixed(2)),
      units_sold: parseInt(r.units_sold, 10),
      orders_count: parseInt(r.orders_count, 10),
    }));

    res.json({
      status: 'SUCCESS',
      count: products.length,
      products,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 6. Anomaly Detection (via Python Analytics Engine)
 */
async function getAnomalies(req, res, next) {
  try {
    const { whereSql, params } = buildFilterClause(req.query);
    const sql = `
      SELECT 
        TO_CHAR(sale_date, 'YYYY-MM-DD') AS date,
        COALESCE(SUM(revenue), 0) AS revenue,
        COUNT(DISTINCT transaction_id) AS orders,
        COALESCE(SUM(quantity), 0) AS units
      FROM sales_transactions
      ${whereSql}
      GROUP BY sale_date
      ORDER BY sale_date ASC;
    `;
    const dbRes = await db.query(sql, params);
    const dailyData = dbRes.rows.map((r) => ({
      date: r.date,
      revenue: parseFloat(r.revenue),
      orders: parseInt(r.orders, 10),
      units: parseInt(r.units, 10),
    }));

    // Call Python FastAPI Anomaly Detection service
    const analyticsResult = await callAnalytics('/analyze/anomalies', { daily_data: dailyData });
    res.json(analyticsResult);
  } catch (err) {
    next(err);
  }
}

/**
 * 7. Inspect Individual Transactions on Flagged Anomaly Date
 */
async function inspectAnomalyDate(req, res, next) {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Query parameter "date" (YYYY-MM-DD) is required.' });
    }

    const sql = `
      SELECT 
        s.transaction_id,
        TO_CHAR(s.sale_date, 'YYYY-MM-DD') AS sale_date,
        s.product_id,
        p.name AS product_name,
        s.category,
        s.quantity,
        s.unit_price,
        s.revenue,
        s.region,
        s.customer_segment,
        s.payment_method
      FROM sales_transactions s
      JOIN products p ON s.product_id = p.product_id
      WHERE s.sale_date = $1
      ORDER BY s.revenue DESC;
    `;
    const result = await db.query(sql, [date]);
    const totalRev = result.rows.reduce((sum, r) => sum + parseFloat(r.revenue), 0);

    res.json({
      status: 'SUCCESS',
      date,
      transaction_count: result.rows.length,
      total_revenue_on_date: parseFloat(totalRev.toFixed(2)),
      transactions: result.rows.map((r) => ({
        transaction_id: r.transaction_id,
        sale_date: r.sale_date,
        product_id: r.product_id,
        product_name: r.product_name,
        category: r.category,
        quantity: parseInt(r.quantity, 10),
        unit_price: parseFloat(r.unit_price),
        revenue: parseFloat(r.revenue),
        region: r.region,
        customer_segment: r.customer_segment,
        payment_method: r.payment_method,
      })),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 8. Sales Forecasting (via Python Analytics Engine)
 */
async function getForecast(req, res, next) {
  try {
    const horizon = parseInt(req.query.horizon || '7', 10);
    const { whereSql, params } = buildFilterClause(req.query);

    const sql = `
      SELECT 
        TO_CHAR(sale_date, 'YYYY-MM-DD') AS date,
        COALESCE(SUM(revenue), 0) AS revenue,
        COUNT(DISTINCT transaction_id) AS orders,
        COALESCE(SUM(quantity), 0) AS units
      FROM sales_transactions
      ${whereSql}
      GROUP BY sale_date
      ORDER BY sale_date ASC;
    `;
    const dbRes = await db.query(sql, params);
    const dailyData = dbRes.rows.map((r) => ({
      date: r.date,
      revenue: parseFloat(r.revenue),
      orders: parseInt(r.orders, 10),
      units: parseInt(r.units, 10),
    }));

    const forecastResult = await callAnalytics('/analyze/forecast', {
      daily_data: dailyData,
      horizon_days: horizon,
    });
    res.json(forecastResult);
  } catch (err) {
    next(err);
  }
}

/**
 * 9. Business Recommendations (Rule-Based Engine)
 */
async function getRecommendations(req, res, next) {
  try {
    // 1. Fetch current KPI metrics
    const { whereSql, params } = buildFilterClause(req.query);
    const kpiSql = `
      SELECT 
        COALESCE(SUM(revenue), 0) AS total_revenue,
        COUNT(DISTINCT transaction_id) AS total_orders,
        COALESCE(SUM(quantity), 0) AS total_units,
        MIN(sale_date) AS min_date,
        MAX(sale_date) AS max_date
      FROM sales_transactions
      ${whereSql};
    `;
    const kpiRes = await db.query(kpiSql, params);
    const kpiRow = kpiRes.rows[0];
    const totalRev = parseFloat(kpiRow.total_revenue);
    const totalOrders = parseInt(kpiRow.total_orders, 10);
    const aov = totalOrders > 0 ? totalRev / totalOrders : 0.0;

    let growthPercent = 0.0;
    if (kpiRow.min_date && kpiRow.max_date) {
      const minDate = new Date(kpiRow.min_date);
      const maxDate = new Date(kpiRow.max_date);
      const diffMs = maxDate.getTime() - minDate.getTime();
      const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);

      const priorEnd = new Date(minDate.getTime() - 24 * 60 * 60 * 1000);
      const priorStart = new Date(priorEnd.getTime() - (diffDays - 1) * 24 * 60 * 60 * 1000);

      const priorRes = await db.query(
        'SELECT COALESCE(SUM(revenue), 0) AS prior_revenue FROM sales_transactions WHERE sale_date >= $1 AND sale_date <= $2',
        [priorStart.toISOString().split('T')[0], priorEnd.toISOString().split('T')[0]]
      );
      const priorRev = parseFloat(priorRes.rows[0].prior_revenue);
      if (priorRev > 0) {
        growthPercent = ((totalRev - priorRev) / priorRev) * 100;
      }
    }

    // 2. Fetch category breakdown
    const catRes = await db.query(
      `SELECT category, COALESCE(SUM(revenue), 0) AS revenue FROM sales_transactions ${whereSql} GROUP BY category ORDER BY revenue DESC;`,
      params
    );

    // 3. Fetch regional breakdown
    const regRes = await db.query(
      `SELECT region, COALESCE(SUM(revenue), 0) AS revenue FROM sales_transactions ${whereSql} GROUP BY region ORDER BY revenue DESC;`,
      params
    );

    // 4. Fetch daily data for anomalies
    const dailyRes = await db.query(
      `SELECT TO_CHAR(sale_date, 'YYYY-MM-DD') AS date, COALESCE(SUM(revenue), 0) AS revenue FROM sales_transactions ${whereSql} GROUP BY sale_date ORDER BY sale_date ASC;`,
      params
    );
    const dailyData = dailyRes.rows.map((r) => ({
      date: r.date,
      revenue: parseFloat(r.revenue),
    }));

    // Get anomalies from analytics engine
    let anomalyList = [];
    try {
      const anomalyRes = await callAnalytics('/analyze/anomalies', { daily_data: dailyData });
      if (anomalyRes && anomalyRes.anomalies) {
        anomalyList = anomalyRes.anomalies;
      }
    } catch (e) {
      console.warn('[Analytics Warning]: Could not fetch anomalies for recommendations:', e.message);
    }

    const recPayload = {
      kpi: {
        total_revenue: totalRev,
        total_orders: totalOrders,
        average_order_value: aov,
        revenue_growth_percent: growthPercent,
      },
      categories: catRes.rows.map((r) => ({ category: r.category, revenue: parseFloat(r.revenue) })),
      regions: regRes.rows.map((r) => ({ region: r.region, revenue: parseFloat(r.revenue) })),
      anomalies: anomalyList,
    };

    const recResult = await callAnalytics('/analyze/recommendations', recPayload);
    res.json(recResult);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getKpis,
  getTrends,
  getCategories,
  getRegions,
  getTopProducts,
  getAnomalies,
  inspectAnomalyDate,
  getForecast,
  getRecommendations,
};
