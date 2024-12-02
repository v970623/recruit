import { json, redirect } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { prisma } from "../utils/db.server";
import { getUserSession } from "../utils/session.server";
import { getSignedUrl } from "../utils/s3.server";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserSession(request);
  if (!userId) {
    throw json({ error: "未登录" }, { status: 401 });
  }

  const url = new URL(request.url);
  const resumeKey = url.searchParams.get("key");

  if (!resumeKey) {
    throw json({ error: "缺少文件路径" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw json({ error: "用户不存在" }, { status: 404 });
    }

    // 查找简历所属的申请记录
    const application = await prisma.application.findFirst({
      where: {
        resumeUrl: resumeKey,
      },
      include: {
        job: true,
      },
    });

    if (!application) {
      throw json({ error: "简历不存在" }, { status: 404 });
    }

    // 权限检查
    const canDownload =
      user.role === "ADMIN" ||
      (user.role === "RECRUITER" && application.job.publisherId === userId);

    if (!canDownload) {
      throw json({ error: "无权限下载此简历" }, { status: 403 });
    }

    // 生成下载链接
    const signedUrl = await getSignedUrl(resumeKey);

    return json(
      { url: signedUrl },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("处理下载请求失败:", error);
    if (error instanceof Response) {
      throw error;
    }
    throw json(
      { error: error instanceof Error ? error.message : "处理下载请求失败" },
      { status: 500 }
    );
  }
};
