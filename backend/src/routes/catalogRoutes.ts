import { Router } from 'express';
import { getLines, getProductsByLine } from '../controllers/catalogController';

export const catalogRouter = Router();

catalogRouter.get('/lines', getLines);
catalogRouter.get('/lines/:lineId/products', getProductsByLine);

export default catalogRouter;
