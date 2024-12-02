import { json, redirect } from "@remix-run/node";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
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

  if (!user || !["ADMIN", "RECRUITER"].includes(user.role)) {
    return redirect("/");
  }

  // 管理员可以查看所有申请，招聘者只能查看自己发布职位的申请
  const applications = await prisma.application.findMany({
    where:
      user.role === "ADMIN"
        ? {} // 管理员无筛选条件，可查看所有
        : {
            job: {
              publisherId: userId, // 招聘者只能查看自己发布职位的申请
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

export const action: ActionFunction = async ({ request }) => {
  const userId = await getUserSession(request);
  if (!userId) {
    return redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || !["ADMIN", "RECRUITER"].includes(user.role)) {
    return redirect("/");
  }

  const formData = await request.formData();
  const applicationId = formData.get("applicationId") as string;
  const status = formData.get("status") as "APPROVED" | "REJECTED";
  const _action = formData.get("_action");

  if (_action === "updateStatus") {
    // 如果是招聘方，确保只能处理自己发布的职位的申请
    if (user.role === "RECRUITER") {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          job: true,
        },
      });

      if (!application || application.job.publisherId !== userId) {
        return json({ error: "无权限处理此申请" }, { status: 403 });
      }
    }

    await prisma.application.update({
      where: { id: applicationId },
      data: { status },
    });
  }

  return json({ success: true });
};

export default function Applications() {
  const data = useLoaderData<typeof loader>();

  // 确保数据存在
  if (!data || !data.applications) {
    return <div className="p-4">加载中...</div>;
  }

  const { applications, userRole, userId } = data;

  if (applications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center text-gray-500">暂无申请</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold mb-6 text-gray-700">
            {userRole === "ADMIN" ? "所有申请" : "职位申请管理"}
          </h1>
          <ApplicationList
            applications={applications}
            userRole={userRole}
            currentUserId={userId}
          />
        </div>
      </div>
    </div>
  );
}
