import { json, redirect } from "@remix-run/node";
import { getUserSession } from "./session.server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 验证用户是否已登录的中间件
export async function requireUser(request: Request) {
  const userId = await getUserSession(request);
  if (!userId) {
    throw redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
    },
  });

  if (!user) {
    throw redirect("/login");
  }

  return user;
}

// 验证用户角色的中间件
export async function requireRole(request: Request, allowedRoles: string[]) {
  const user = await requireUser(request);

  if (!allowedRoles.includes(user.role)) {
    throw json({ message: "无权访问此页面" }, { status: 403 });
  }

  return user;
}

// 验证管理员权限的中间件
export async function requireAdmin(request: Request) {
  return requireRole(request, ["ADMIN"]);
}
