import { Router, type IRouter } from "express";
import healthRouter from "./health";
import siteContentRouter from "./site-content";
import adminMailboxRouter from "./admin-mailbox";

const router: IRouter = Router();

router.use(healthRouter);
router.use(siteContentRouter);
router.use(adminMailboxRouter);

export default router;
