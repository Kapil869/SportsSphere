import { Router } from 'express';
import * as controller from '../controllers/newsController.js';

const router = Router();

router.get('/categories', controller.getCategories);
router.get('/home', controller.getHome);
router.get('/category/:slug', controller.getByCategory);
router.get('/search', controller.search);
router.get('/article/:id', controller.getArticle);

export default router;
