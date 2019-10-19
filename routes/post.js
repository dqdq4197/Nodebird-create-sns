const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Post, Hashtag, User } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

fs.readdir('uploads', (error) => {
  if (error) {
    console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
    fs.mkdirSync('uploads');
  }
});
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/');
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);  //path.extname -> 파일명에 확장자만 가져옴 (fire.jpg -> .jpg)
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);  //path.basename() -> .jpg를 제외한 fire만 가져옴
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/img', isLoggedIn, upload.single('img'), (req, res) => {
  //console.log(req.file);
  res.json({ url: `/img/${req.file.filename}` });
});

const upload2 = multer();
router.post('/', isLoggedIn, upload2.none(), async (req, res, next) => {
  try {
    const post = await Post.create({
      content: req.body.content,
      img: req.body.url,
      userId: req.user.id,
    }); 
    const hashtags = req.body.content.match(/#[^\s]*/g);
    if (hashtags) {
      const result = await Promise.all(
        hashtags.map(
          tag => 
            Hashtag.findOrCreate({
               where: { title: tag.slice(1).toLowerCase() },
            })
        )
      );
      await post.addHashtags(result.map(r => r[0]));
    }
    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/delete/:id', async(req,res,next) => {
  const post_id= await Post.findOne({where: {id: req.params.id}});
  const tag = await post_id.getHashtags();
  try {
    await Post.destroy({where: {id: req.params.id}});
    await Hashtag.destroy ({where: {id: tag}});
    res.send('success');
  } catch (error) {
    console.error(error);
    return next(error);
  }
})

router.get('/hashtag', async (req, res, next) => {
  const query = req.query.hashtag;
  console.log(query);
  if (!query) {
    return res.redirect('/');
  }
  try {
    const hashtag = await Hashtag.findOne({ where: { title: query } });
    let posts = [];
    if (hashtag) {
      posts = await hashtag.getPosts({ include: [{ model: User }] });
    }
    return res.render('main', {
      title: `${query} | NodeBird`,
      user: req.user,
      twits: posts,
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

module.exports = router;