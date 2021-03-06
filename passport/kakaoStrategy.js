const KakaoStrategy = require('passport-kakao').Strategy;
const { User } = require('../models');

module.exports = (passport) => {
  passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_ID,
    callbackURL: '/auth/kakao/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const exUser = await User.findOne({ where: { snsId: profile.id, provider: 'kakao' }});
      if (exUser) {
        done(null, exUser);
      } else {
        const newUser = await User.create({
          email: profile._json && profile._json.kakao_account.email,
          nick: profile.displayName,
          snsId: profile.id,
          provider: 'kakao',
        });
        done(null, newUser);
      }
    } catch (error) {
      console.error(error);
      done(error);
    }
  }));
};



//profile._raw {
//  "id":1188072874,"properties": {
//    "nickname":"희수",
//    "profile_image":"http://k.kakaocdn.net/dn/1PFLX/btqyWVM9nYv/chbQ4S2dDcC8NCRDlFR0BK/profile_640x640s.jpg",
//    "thumbnail_image":"http://k.kakaocdn.net/dn/1PFLX/btqyWVM9nYv/chbQ4S2dDcC8NCRDlFR0BK/profile_110x110c.jpg"
//  },
//  "kakao_account": {
//    "profile_needs_agreement":false,
//    "has_email":true,
//    "email_needs_agreement":false,
//    "is_email_valid":true,
//    "is_email_verified":true,
//    "email":"dqdq4197@hanmail.net"
//  }
//}