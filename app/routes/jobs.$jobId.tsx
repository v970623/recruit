import React from "react";
import { LoaderFunctionArgs, json, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { prisma } from "../utils/db.server";
import { Outlet } from "@remix-run/react";
import type { JobDetailLoaderData } from "../types/job";
import { requireUser } from "../utils/auth.server";
import type { Prisma } from "@prisma/client";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const { jobId } = params;

  if (!jobId) {
    throw new Response("未找到职位", { status: 404 });
  }

  const jobInclude = {
    publisher: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    applications: {
      where: {
        applicantId: user.id,
      },
      select: {
        id: true,
        status: true,
      },
    },
  } satisfies Prisma.JobInclude;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: jobInclude,
  });

  if (!job) {
    throw new Response("职位不存在", { status: 404 });
  }

  // 检查用户权限
  const isPublisher = job.publisherId === user.id;
  const isAdmin = user.role === "ADMIN";
  const isApplicant = user.role === "APPLICANT";
  const hasApplied = job.applications.length > 0;

  const jobDetail: JobDetailLoaderData = {
    id: job.id,
    title: job.title,
    description: job.description,
    location: job.location,
    salary: job.salary,
    publisherId: job.publisherId,
    status: job.status as "OPEN" | "CLOSED",
    postedAt: job.postedAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    publisher: {
      id: job.publisher.id,
      name: job.publisher.name,
      email: job.publisher.email,
    },
    isPublisher,
    isAdmin,
    isApplicant,
    hasApplied,
    currentUser: {
      id: user.id,
      role: user.role,
    },
  };

  return json(jobDetail);
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const { jobId } = params;

  if (!jobId) {
    throw new Response("职位不存在", { status: 404 });
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new Response("职位不存在", { status: 404 });
  }

  // 检查权限
  if (job.publisherId !== user.id && user.role !== "ADMIN") {
    throw new Response("无权限执行此操作", { status: 403 });
  }

  if (request.method === "DELETE") {
    await prisma.job.delete({
      where: { id: jobId },
    });
    return json({ success: true });
  }

  if (request.method === "PATCH") {
    const formData = await request.formData();
    const status = formData.get("status") as "OPEN" | "CLOSED";

    if (status !== "OPEN" && status !== "CLOSED") {
      throw new Response("无效的状态值", { status: 400 });
    }

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: status,
      },
    });
    return json({ success: true });
  }

  throw new Response("不支持的请求方法", { status: 405 });
}

export default function JobDetail() {
  const job = useLoaderData<typeof loader>();

  const handleStatusChange = async (newStatus: "OPEN" | "CLOSED") => {
    const formData = new FormData();
    formData.append("status", newStatus);
    await fetch(`/jobs/${job.id}`, {
      method: "PATCH",
      body: formData,
    });
    window.location.reload();
  };

  const handleDelete = async () => {
    if (
      window.confirm("确定要删除这个职位吗？若该职位已有申请记录，无法删除")
    ) {
      await fetch(`/jobs/${job.id}`, {
        method: "DELETE",
      });
      window.location.href = "/jobs";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-5">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <h1 className="text-2xl font-medium text-gray-900 tracking-tight">
                  {job.title}
                </h1>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      job.status === "OPEN"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {job.status === "OPEN" ? "招聘中" : "已结束"}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{job.location}</span>
                <span>•</span>
                <span>
                  发布于 {new Date(job.postedAt).toLocaleDateString()}
                </span>
                <span>•</span>
                <span>发布者: {job.publisher.name || job.publisher.email}</span>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-base font-normal text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>

              {job.salary !== null && (
                <div className="pt-4">
                  <span className="inline-flex items-center px-3 py-1 text-sm font-normal text-gray-600 bg-gray-50 rounded-md">
                    💰 薪资: ¥{job.salary.toLocaleString()}
                  </span>
                </div>
              )}

              {/* 操作按钮区域 */}
              <div className="pt-6 flex space-x-4">
                {/* 求职者可见的申请按钮 */}
                {job.isApplicant && job.status === "OPEN" && (
                  <div>
                    {job.hasApplied ? (
                      <span className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-lg inline-block">
                        已申请
                      </span>
                    ) : (
                      <Link
                        to="apply"
                        className="px-6 py-2.5 bg-gradient-to-r no-underline from-indigo-600 to-indigo-500 text-white font-medium rounded-lg hover:shadow-lg hover:from-indigo-500 hover:to-indigo-400 transition-all duration-300"
                      >
                        申请职位
                      </Link>
                    )}
                  </div>
                )}

                {/* 发布者或管理员可见的管理按钮 */}
                {(job.isPublisher || job.isAdmin) && (
                  <div className="flex space-x-4">
                    {/* 状态切换按钮 */}
                    <button
                      onClick={() =>
                        handleStatusChange(
                          job.status === "OPEN" ? "CLOSED" : "OPEN"
                        )
                      }
                      className={`px-6 py-2.5 font-medium rounded-lg transition-all duration-300 ${
                        job.status === "OPEN"
                          ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                          : "bg-green-500 hover:bg-green-600 text-white"
                      }`}
                    >
                      {job.status === "OPEN" ? "结束招聘" : "重新开放"}
                    </button>

                    {/* 删除按钮 */}
                    <button
                      onClick={handleDelete}
                      className="px-6 py-2.5 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-all duration-300"
                    >
                      删除职位
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
