import { Request, Response } from 'express';
import { pool } from '../db';

/**
 * GET /api/catalogs/lines
 * Retorna todas las líneas de producción activas con su lista de productos autorizados.
 */
export async function getLines(_req: Request, res: Response): Promise<void> {
  try {
    const query = `
      SELECT 
        lp.id,
        lp.codigo,
        lp.nombre,
        lp.tipo_linea,
        lp.capacidad_litros,
        lp.estado,
        lp.activo,
        COALESCE(
          ARRAY_AGG(lpp.producto_id) FILTER (WHERE lpp.producto_id IS NOT NULL),
          '{}'
        ) AS allowed_product_ids
      FROM lineas_produccion lp
      LEFT JOIN lineas_productos_permitidos lpp ON lpp.linea_id = lp.id
      WHERE lp.activo = TRUE
      GROUP BY lp.id
      ORDER BY lp.codigo ASC;
    `;

    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('[catalogs] Error al obtener líneas de producción:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al obtener líneas de producción.',
    });
  }
}

/**
 * GET /api/catalogs/lines/:lineId/products
 * Retorna los productos autorizados para la línea especificada (buscando por UUID o código).
 */
export async function getProductsByLine(req: Request, res: Response): Promise<void> {
  try {
    const { lineId } = req.params;

    if (!lineId) {
      res.status(400).json({
        error: 'MISSING_PARAM',
        message: 'Se requiere el identificador de la línea (lineId).',
      });
      return;
    }

    // Comprobar existencia de la línea por UUID o código (ej. 'L-FERMENT-02')
    const lineCheck = await pool.query(
      `SELECT id, codigo, nombre FROM lineas_produccion 
       WHERE (id::text = $1 OR codigo = $1) AND activo = TRUE 
       LIMIT 1;`,
      [lineId]
    );

    if (lineCheck.rows.length === 0) {
      res.status(404).json({
        error: 'LINE_NOT_FOUND',
        message: `Línea de producción '${lineId}' no encontrada o inactiva.`,
      });
      return;
    }

    const verifiedLineId = lineCheck.rows[0].id;

    const query = `
      SELECT 
        p.id,
        p.codigo,
        p.nombre,
        p.tipo_linea,
        p.descripcion,
        p.norma_tecnica,
        p.activo
      FROM lineas_productos_permitidos lpp
      JOIN productos p ON p.id = lpp.producto_id
      WHERE lpp.linea_id = $1
        AND p.activo = TRUE
      ORDER BY p.codigo ASC;
    `;

    const result = await pool.query(query, [verifiedLineId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('[catalogs] Error al obtener productos de la línea:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al obtener productos de la línea de producción.',
    });
  }
}
