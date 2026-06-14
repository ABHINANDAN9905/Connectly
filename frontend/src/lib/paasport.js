import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Existing user — mark as verified
          if (!user.isVerified) {
            user.isVerified = true;
            await user.save();
          }
          return done(null, user);
        }

        // New user — create
        const base = profile.displayName
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "")
          .slice(0, 18) || "user";
        
        let username = base;
        let suffix = 1;
        while (await User.exists({ username })) {
          username = `${base}${suffix}`;
          suffix++;
        }

        user = await User.create({
          fullName: profile.displayName,
          username,
          email: profile.emails[0].value,
          profilePic: profile.photos[0]?.value || "",
          isVerified: true,
          isOnboarded: false,
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;