import connectDB from "@/config/Database";
import User from "@/models/User";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      // 1. Connect to the database
      await connectDB();

      // 2. Check if the user exists
      const userExists = await User.findOne({ email: profile.email });

      if (!userExists) {
        // Truncate the user name if it's too long
        const username = profile.name.slice(0, 20);

        // 3. Create a new user with default userType set to "user"
        await User.create({
          email: profile.email,
          username,
          image: profile.picture,
          userType: "user", // Default to "user" for new sign-ins
        });
      }

      // 4. Return true to allow sign-in
      return true;
    },
    async session({ session }) {
      // 1. Get the user from the database
      const user = await User.findOne({ email: session.user.email });

      // 2. Assign the user ID and userType to the session
      session.user.id = user._id.toString();
      session.user.userType = user.userType; // Include userType in the session

      // 3. Return the session
      return session;
    },
  },
};
