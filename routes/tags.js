import _ from 'lodash';

import ensureAuth from '../middlewares/ensureAuthMiddleware';

import { Tag } from '../models';

export default (router) => {
  router.get('tags', '/tags', ensureAuth, async (ctx) => {
    const tags = await Tag.findAll();
    ctx.render('tags/index', { tags });
  });

  router.get('newTag', '/tags/new', ensureAuth, (ctx) => {
    ctx.render('tags/newTag', { form: {}, errors: {} });
  });

  router.post('addTag', '/tags', ensureAuth, async (ctx) => {
    const { form } = ctx.request.body;

    const tag = Tag.build(form);

    try {
      await tag.save();
      ctx.flash.set(`Tag "${tag.name}" has been created`);
      ctx.redirect(router.url('tags'));
    } catch (e) {
      ctx.render('tags/newTag', { form, errors: _.groupBy(e.errors, 'path') });
    }
  });

  router.get('editTag', '/tags/:id/edit', ensureAuth, async (ctx) => {
    const tag = await Tag.findById(ctx.params.id);

    ctx.render('tags/editTag', { form: { id: tag.id, name: tag.name }, errors: {} });
  });

  router.put('updateTag', '/tags/:id', ensureAuth, async (ctx) => {
    const { form } = ctx.request.body;

    const current = await Tag.findById(ctx.params.id);

    try {
      await current.update(form);

      ctx.flash.set('Tag has been updated');
      ctx.redirect(router.url('tags'));
    } catch (e) {
      ctx.render('tags/editTag', { form: { ...form, id: ctx.params.id }, errors: _.groupBy(e.errors, 'path') });
    }
  });

  router.delete('deleteTag', '/tags/:id', ensureAuth, async (ctx) => {
    const tag = await Tag.findById(ctx.params.id);

    await tag.destroy();

    ctx.flash.set('Tag has been deleted');
    ctx.redirect(router.url('tags'));
  });
};
