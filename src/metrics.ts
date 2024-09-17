import { Router, type Request, type Response } from 'express';
import UtilService from '@/modules/util/util.service';

const route: Router = Router();
route.get('/', async (_req: Request, res: Response) => {
  try {
    const utils = new UtilService();
    const value = await utils.metric().catch((e) => {
      throw e;
    });
    res.send(value);
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.toString(),
    });
  }
});

export default route;
