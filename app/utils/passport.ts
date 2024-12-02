import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { PrismaClient, User } from "@prisma/client";

const prisma = new PrismaClient();

// 定义 done 回调函数的类型
type DoneCallback = (
  error: any,
  user?: any,
  options?: { message: string }
) => void;

// 扩展 Express 的类型定义
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: string;
      name?: string | null;
    }
  }
}

// 配置 Passport 序列化和反序列化
passport.serializeUser((user: Express.User, done: DoneCallback) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done: DoneCallback) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      },
    });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// 配置本地策略
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email: string, password: string, done: DoneCallback) => {
      try {
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return done(null, false, { message: "用户不存在" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "密码错误" });
        }

        return done(null, {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        });
      } catch (error) {
        return done(error);
      }
    }
  )
);

export default passport;
