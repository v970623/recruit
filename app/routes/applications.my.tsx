import { json, redirect } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "../utils/db.server";
import { getUserSession } from "../utils/session.server";
import ApplicationList from "../components/ApplicationList";
import * as React from "react";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserSession(request);
  if (!userId) {
    return redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || user.role !== "RECRUITER") {
    return redirect("/");
  }

  // 只获取招聘方发布的职位的申请
  const applications = await prisma.application.findMany({
    where: {
      jobId: {
        not: undefined,
      },
      job: {
        publisherId: userId,
      },
    },
    include: {
      applicant: {
        select: {
          name: true,
          email: true,
        },
      },
      job: {
        select: {
          title: true,
          publisherId: true,
        },
      },
    },
    orderBy: {
      appliedAt: "desc",
    },
  });

  return json({ applications, userRole: user.role, userId });
};

// 复用 /applications 路由的 action 处理程序

export default function MyApplications() {
  const { applications, userRole, userId } = useLoaderData<typeof loader>();
  if (applications.length === 0) {
    return <div>暂无申请</div>;
  } else {
    return (
      <div className="container mx-auto px-4 py-8 bg-white">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">职位申请管理</h1>
        <ApplicationList
          applications={applications}
          userRole={userRole}
          currentUserId={userId}
        />
      </div>
    );
  }
}
