import { createCookieSessionStorage } from "@remix-run/node";
import { SessionStorage } from "@remix-run/node";

// 配置会话存储
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_session", // 使用前缀以避免命名冲突
    sameSite: "lax", // 防止 CSRF
    path: "/", // 记住要在所有路由中使用
    httpOnly: true, // 为了安全性，不允许 JS 访问 cookie
    secrets: [process.env.SESSION_SECRET || "12345678"],
    secure: process.env.NODE_ENV === "production", // 在生产环境启用 HTTPS
  },
});

// 获取会话数据的函数
export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

// 创建登录会话
export async function createUserSession(userId: string, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set("userId", userId);

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo,
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

// 获取用户会话信息
export async function getUserSession(request: Request) {
  const session = await getSession(request);
  const userId = session.get("userId");
  if (!userId) return null;
  return userId;
}

// 注销并销毁会话
export async function logout(request: Request) {
  const session = await getSession(request);
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
