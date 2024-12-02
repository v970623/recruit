import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import React from "react";
import { prisma } from "../utils/db.server";
import { requireUser } from "../utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const isRecruiter = user.role === "RECRUITER";
  const isAdmin = user.role === "ADMIN";

  // 获取职位
  const jobs = await prisma.job.findMany({
    where: {
      // 如果不是管理员也不是招聘方,则只显示开放的职位
      ...(!isAdmin && !isRecruiter ? { status: "OPEN" } : {}),
    },
    orderBy: { postedAt: "desc" },
    include: {
      publisher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      applications: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  return json({
    jobs,
    isRecruiter,
    isAdmin,
    currentUserId: user.id,
  });
}

export default function JobsIndex() {
  const { jobs, isRecruiter, isAdmin, currentUserId } =
    useLoaderData<typeof loader>();

  return (
    <div className="max-w-7xl mx-auto px-8 py-16">
      <div className="grid gap-6">
        {jobs.map((job) => (
          <Link
            key={job.id}
            to={`/jobs/${job.id}`}
            className="bg-white rounded-xl shadow hover:shadow-lg transition-all duration-300 overflow-hidden group no-underline"
          >
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {job.title}
                    </h2>
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
                      {(isAdmin ||
                        (isRecruiter && job.publisherId === currentUserId)) && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                          {job.applications.length} 份申请
                        </span>
                      )}
                      {isRecruiter && job.publisherId === currentUserId && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          我发布的
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 leading-relaxed text-base font-normal">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-full text-gray-700 font-medium">
                      <svg
                        className="w-4 h-4 mr-1.5 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {job.location}
                    </span>

                    {job.salary && (
                      <span className="inline-flex items-center px-3 py-1.5 bg-green-50 rounded-full text-green-700 font-medium">
                        <svg
                          className="w-4 h-4 mr-1.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {new Intl.NumberFormat("zh-CN", {
                          style: "currency",
                          currency: "CNY",
                          maximumFractionDigits: 0,
                        }).format(job.salary)}
                      </span>
                    )}

                    <span className="inline-flex items-center px-3 py-1.5 bg-blue-50 rounded-full text-blue-700 font-medium">
                      <svg
                        className="w-4 h-4 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {new Date(job.postedAt).toLocaleDateString("zh-CN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {jobs.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              暂无职位发布
            </h3>
            {isRecruiter && (
              <p className="text-gray-500">
                点击右上角的"发布新职位"按钮来发布您的第一个职位
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
