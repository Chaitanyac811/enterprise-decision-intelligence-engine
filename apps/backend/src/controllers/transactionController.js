/**
 * Transaction Controller
 * Paginated, searchable, and filterable transaction list
 */

const db = require('../db');

async function getTransactions(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit || '15', 10)));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let pIdx = 1;

    if (req.query.startDate) {
      conditions.push(`s.sale_date >= $${pIdx++}`);
      params.push(req.query.startDate);
    }
    if (req.query.endDate) {
      conditions.push(`s.sale_date <= $${pIdx++}`);
      params.push(req.query.endDate);
    }
    if (req.query.region && req.query.region !== 'All') {
      conditions.push(`s.region = $${pIdx++}`);
      params.push(req.query.region);
    }
    if (req.query.category && req.query.category !== 'All') {
      conditions.push(`s.category = $${pIdx++}`);
      params.push(req.query.category);
    }
    if (req.query.search) {
      conditions.push(
        `(s.transaction_id ILIKE $${pIdx} OR p.name ILIKE $${pIdx} OR s.product_id ILIKE $${pIdx})`
      );
      params.push(`%${req.query.search}%`);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count
    const countSql = `
      SELECT COUNT(*) AS total
      FROM sales_transactions s
      JOIN products p ON s.product_id = p.product_id
      ${whereClause};
    `;
    const countRes = await db.query(countSql, params);
    const totalRecords = parseInt(countRes.rows[0].total, 10);

    // Records
    const dataSql = `
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
      ${whereClause}
      ORDER BY s.sale_date DESC, s.created_at DESC
      LIMIT $${pIdx++} OFFSET $${pIdx++};
    `;
    params.push(limit, offset);

    const dataRes = await db.query(dataSql, params);
    const totalPages = Math.ceil(totalRecords / limit);

    res.json({
      status: 'SUCCESS',
      pagination: {
        page,
        limit,
        total_records: totalRecords,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
      transactions: dataRes.rows.map((r) => ({
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

module.exports = {
  getTransactions,
};
